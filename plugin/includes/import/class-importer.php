<?php
/**
 * Orchestrates one-shot package import.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Import;

use CTW_Native\Adapters\ElementsKit_Adapter;
use CTW_Native\Adapters\Menu_Adapter;
use CTW_Native\Adapters\MetForm_Adapter;
use CTW_Native\Adapters\WooCommerce_Pages_Adapter;
use CTW_Native\Adapters\WooCommerce_Products_Adapter;
use CTW_Native\Adapters\WPCode_Adapter;
use CTW_Native\Elementor\Document_Writer;
use CTW_Native\Stack\Parent_Theme;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One-shot package apply: guard → parent → read → media → pages → woo → adapters → mark.
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
			'products'  => array(),
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

		$woo_pages = WooCommerce_Pages_Adapter::import_pages( $package, $media );
		if ( is_wp_error( $woo_pages ) ) {
			return $woo_pages;
		}
		foreach ( $woo_pages['pages'] as $woo_page_id ) {
			$created['pages'][] = (int) $woo_page_id;
		}

		$products = WooCommerce_Products_Adapter::import_products( $package, $media );
		if ( is_wp_error( $products ) ) {
			return $products;
		}
		$created['products'] = $products;

		Menu_Adapter::import_menus( $package, $created['pages'] );

		Import_Guard::mark_done( $created );

		return array(
			'ok'      => true,
			'created' => $created,
			'front'   => $front_id,
		);
	}
}
