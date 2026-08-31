<?php
/**
 * Nav menu adapter for package theme.menus.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates theme locations and page menu items from the package.
 */
final class Menu_Adapter {

	/**
	 * @param array<string,mixed> $package  Package.
	 * @param list<int>           $page_ids Page IDs in package pages order.
	 */
	public static function import_menus( array $package, array $page_ids ): void {
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
			$name    = isset( $menu['name'] ) ? (string) $menu['name'] : 'Menu';
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
