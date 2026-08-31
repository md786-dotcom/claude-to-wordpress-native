<?php
/**
 * WPCode Free adapter — CSS / JS / HTML / PHP.
 *
 * Targets wordpress.org WPCode Lite (`insert-headers-and-footers`), not WPCode Pro.
 * Free stores code type and auto-insert location as taxonomies (`wpcode_type`,
 * `wpcode_location`) plus `_wpcode_auto_insert` = 1. It does not read the unused
 * post meta this importer used to write. CSS/JS/HTML must use Site Wide Header
 * or Footer; `everywhere` is PHP-only. Do not write Pro types (scss, blocks),
 * Pro locations (CSS-selector anywhere), or device/conditional rules.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

use CTW_Native\Contract\Package_Contract;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates WPCode Free snippets when the plugin is active.
 */
final class WPCode_Adapter {

	public const TYPE_TAXONOMY     = 'wpcode_type';
	public const LOCATION_TAXONOMY = 'wpcode_location';
	public const AUTO_INSERT_META  = '_wpcode_auto_insert';

	/**
	 * @param mixed $snippets Snippet list.
	 * @return list<int>|\WP_Error
	 */
	public static function import_snippets( $snippets ) {
		if ( ! is_array( $snippets ) || empty( $snippets ) ) {
			return array();
		}

		$ids = array();
		foreach ( $snippets as $snippet ) {
			if ( ! is_array( $snippet ) ) {
				continue;
			}
			$type = isset( $snippet['type'] ) ? (string) $snippet['type'] : '';
			if ( ! Package_Contract::is_snippet_type( $type ) ) {
				return new \WP_Error( 'ctw_bad_snippet', 'Snippet type is not allowed: ' . $type );
			}
			$title    = isset( $snippet['title'] ) ? (string) $snippet['title'] : 'Snippet';
			$code     = isset( $snippet['code'] ) ? (string) $snippet['code'] : '';
			$location = isset( $snippet['location'] ) ? (string) $snippet['location'] : '';

			$post_id = self::store_snippet( $title, $code, $type, $location );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			$ids[] = (int) $post_id;
		}

		self::rebuild_snippet_cache();
		return $ids;
	}

	/**
	 * Map a package location to a WPCode Free `wpcode_location` term slug.
	 *
	 * css/js/html: header|everywhere → site_wide_header, footer → site_wide_footer.
	 * php: everywhere → everywhere, header/footer → site_wide_*.
	 */
	public static function map_free_location( string $type, string $location ): string {
		$type     = strtolower( $type );
		$location = strtolower( $location );
		if ( '' === $location ) {
			$location = 'php' === $type ? 'everywhere' : 'header';
		}

		if ( 'php' === $type ) {
			if ( 'header' === $location ) {
				return 'site_wide_header';
			}
			if ( 'footer' === $location ) {
				return 'site_wide_footer';
			}
			return 'everywhere';
		}

		if ( 'footer' === $location ) {
			return 'site_wide_footer';
		}
		return 'site_wide_header';
	}

	/**
	 * Prefer WPCode CPT when present; otherwise store as a private fallback post.
	 *
	 * @return int|\WP_Error
	 */
	private static function store_snippet( string $title, string $code, string $type, string $location ) {
		$wp_location = self::map_free_location( $type, $location );
		$saved       = self::save_with_wpcode_class( $title, $code, $type, $wp_location );
		if ( is_int( $saved ) && $saved > 0 ) {
			self::apply_free_terms_and_meta( $saved, $type, $location, $wp_location );
			return $saved;
		}

		$post_type = post_type_exists( 'wpcode' ) ? 'wpcode' : 'ctw_snippet';
		if ( 'ctw_snippet' === $post_type && ! post_type_exists( 'ctw_snippet' ) ) {
			register_post_type(
				'ctw_snippet',
				array(
					'public' => false,
					'label'  => 'CTW Snippets',
				)
			);
		}

		$post_id = wp_insert_post(
			array(
				'post_title'   => $title,
				'post_content' => $code,
				'post_status'  => 'publish',
				'post_type'    => $post_type,
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		self::apply_free_terms_and_meta( (int) $post_id, $type, $location, $wp_location );
		return (int) $post_id;
	}

	/**
	 * Use WPCode_Snippet::save() when the Free plugin class is loaded.
	 *
	 * auto_insert must be integer 1. WPCode compares with `=== 1` before it
	 * writes the location taxonomy.
	 *
	 * @return int|false
	 */
	private static function save_with_wpcode_class( string $title, string $code, string $type, string $wp_location ) {
		$class = '\\WPCode_Snippet';
		if ( ! class_exists( $class ) ) {
			return false;
		}

		$snippet = new $class(
			array(
				'title'       => $title,
				'code'        => $code,
				'code_type'   => $type,
				'location'    => $wp_location,
				'auto_insert' => 1,
				'active'      => true,
				'tags'        => array( 'ctw-native' ),
			)
		);
		if ( ! is_object( $snippet ) || ! method_exists( $snippet, 'save' ) ) {
			return false;
		}
		$saved = $snippet->save();
		if ( ! is_numeric( $saved ) || (int) $saved <= 0 ) {
			return false;
		}
		return (int) $saved;
	}

	/**
	 * Write the taxonomies and meta WPCode Free actually queries.
	 */
	private static function apply_free_terms_and_meta( int $post_id, string $type, string $package_location, string $wp_location ): void {
		wp_set_post_terms( $post_id, $type, self::TYPE_TAXONOMY );
		wp_set_post_terms( $post_id, $wp_location, self::LOCATION_TAXONOMY );
		update_post_meta( $post_id, self::AUTO_INSERT_META, 1 );
		update_post_meta( $post_id, '_ctw_snippet_type', $type );
		update_post_meta( $post_id, '_ctw_snippet_location', $package_location );
	}

	/**
	 * Rebuild WPCode's `wpcode_snippets` option. Free reads that cache by default.
	 */
	private static function rebuild_snippet_cache(): void {
		if ( ! function_exists( 'wpcode' ) ) {
			return;
		}
		$plugin = call_user_func( 'wpcode' );
		if ( ! is_object( $plugin ) || ! isset( $plugin->cache ) ) {
			return;
		}
		$cache = $plugin->cache;
		if ( is_object( $cache ) && method_exists( $cache, 'cache_all_loaded_snippets' ) ) {
			$cache->cache_all_loaded_snippets();
		}
	}
}
