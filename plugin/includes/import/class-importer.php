<?php
/**
 * Orchestrates one-shot package import.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Import;

use CTW_Native\Adapters\ElementsKit_Adapter;
use CTW_Native\Adapters\MetForm_Adapter;
use CTW_Native\Adapters\WPCode_Adapter;
use CTW_Native\Elementor\Document_Writer;
use CTW_Native\Stack\Parent_Theme;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Importer.
 */
final class Importer {

	/**
	 * Run import from active child package.
	 *
	 * @return array<string,mixed>|\WP_Error
	 */
	public function run() {
		$can = Import_Guard::assert_can_import();
		if ( is_wp_error( $can ) ) {
			return $can;
		}

		$parent = Parent_Theme::assert_hello_parent();
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		$package = Package_Reader::read();
		if ( is_wp_error( $package ) ) {
			return $package;
		}

		$media = new Media_Sideloader();
		$side  = $media->sideload_all( $package );
		if ( is_wp_error( $side ) ) {
			return $side;
		}

		$created = array(
			'pages'     => array(),
			'forms'     => array(),
			'snippets'  => array(),
			'templates' => array(),
		);

		$front_id = 0;
		$pages    = isset( $package['pages'] ) && is_array( $package['pages'] ) ? $package['pages'] : array();
		foreach ( $pages as $page ) {
			if ( ! is_array( $page ) ) {
				continue;
			}
			$title    = isset( $page['title'] ) ? (string) $page['title'] : '';
			$slug     = isset( $page['slug'] ) ? (string) $page['slug'] : '';
			$elements = isset( $page['elements'] ) && is_array( $page['elements'] ) ? $page['elements'] : array();
			$elements = $media->rewrite_tree( $elements );
			$post_id  = Document_Writer::write_page( $title, $slug, $elements );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			$created['pages'][] = (int) $post_id;
			if ( ! empty( $page['isFrontPage'] ) ) {
				$front_id = (int) $post_id;
			}
		}

		if ( $front_id > 0 ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $front_id );
		}

		$header = ElementsKit_Adapter::import_template( $package['header'] ?? null, 'header', $media );
		if ( is_wp_error( $header ) ) {
			return $header;
		}
		if ( $header > 0 ) {
			$created['templates'][] = $header;
		}

		$footer = ElementsKit_Adapter::import_template( $package['footer'] ?? null, 'footer', $media );
		if ( is_wp_error( $footer ) ) {
			return $footer;
		}
		if ( $footer > 0 ) {
			$created['templates'][] = $footer;
		}

		$forms = MetForm_Adapter::import_forms( $package['forms'] ?? array() );
		if ( is_wp_error( $forms ) ) {
			return $forms;
		}
		$created['forms'] = $forms;

		$snippets = WPCode_Adapter::import_snippets( $package['snippets'] ?? array() );
		if ( is_wp_error( $snippets ) ) {
			return $snippets;
		}
		$created['snippets'] = $snippets;

		$this->import_menus( $package, $created['pages'] );

		Import_Guard::mark_done( $created );

		return array(
			'ok'      => true,
			'created' => $created,
			'front'   => $front_id,
		);
	}

	/**
	 * @param array<string,mixed> $package Package.
	 * @param list<int>           $page_ids Page IDs in order.
	 */
	private function import_menus( array $package, array $page_ids ): void {
		$theme = isset( $package['theme'] ) && is_array( $package['theme'] ) ? $package['theme'] : array();
		$menus = isset( $theme['menus'] ) && is_array( $theme['menus'] ) ? $theme['menus'] : array();
		if ( empty( $menus ) ) {
			return;
		}

		$slug_to_id = array();
		$pages      = isset( $package['pages'] ) && is_array( $package['pages'] ) ? $package['pages'] : array();
		foreach ( $pages as $index => $page ) {
			if ( ! is_array( $page ) || empty( $page_ids[ $index ] ) ) {
				continue;
			}
			$slug_to_id[ (string) $page['slug'] ] = (int) $page_ids[ $index ];
		}

		$locations = array();
		foreach ( $menus as $menu ) {
			if ( ! is_array( $menu ) ) {
				continue;
			}
			$name = isset( $menu['name'] ) ? (string) $menu['name'] : 'Menu';
			$menu_id = wp_create_nav_menu( $name );
			if ( is_wp_error( $menu_id ) ) {
				continue;
			}
			$items = isset( $menu['items'] ) && is_array( $menu['items'] ) ? $menu['items'] : array();
			foreach ( $items as $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				$page_slug = isset( $item['pageSlug'] ) ? (string) $item['pageSlug'] : '';
				if ( ! isset( $slug_to_id[ $page_slug ] ) ) {
					continue;
				}
				wp_update_nav_menu_item(
					(int) $menu_id,
					0,
					array(
						'menu-item-title'     => isset( $item['title'] ) ? (string) $item['title'] : '',
						'menu-item-object'    => 'page',
						'menu-item-object-id' => $slug_to_id[ $page_slug ],
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					)
				);
			}
			$location = isset( $menu['location'] ) ? (string) $menu['location'] : '';
			if ( '' !== $location ) {
				$locations[ $location ] = (int) $menu_id;
			}
		}
		if ( ! empty( $locations ) ) {
			set_theme_mod( 'nav_menu_locations', $locations );
		}
	}
}
