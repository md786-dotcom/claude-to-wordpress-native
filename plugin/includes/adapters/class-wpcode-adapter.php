<?php
/**
 * WPCode adapter — CSS / JS / HTML only.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

use CTW_Native\Contract\Package_Contract;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates WPCode snippets when the plugin is active.
 */
final class WPCode_Adapter {

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
				return new \WP_Error( 'ctw_php_snippet', 'Only css, js, and html snippets are allowed.' );
			}
			$title    = isset( $snippet['title'] ) ? (string) $snippet['title'] : 'Snippet';
			$code     = isset( $snippet['code'] ) ? (string) $snippet['code'] : '';
			$location = isset( $snippet['location'] ) ? (string) $snippet['location'] : 'everywhere';

			$post_id = self::store_snippet( $title, $code, $type, $location );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			$ids[] = (int) $post_id;
		}
		return $ids;
	}

	/**
	 * Prefer WPCode CPT when present; otherwise store as a private option-backed post.
	 *
	 * @return int|\WP_Error
	 */
	private static function store_snippet( string $title, string $code, string $type, string $location ) {
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

		update_post_meta( (int) $post_id, '_wpcode_code_type', $type );
		update_post_meta( (int) $post_id, 'wpcode_code_type', $type );
		update_post_meta( (int) $post_id, '_wpcode_auto_insert_location', $location );
		update_post_meta( (int) $post_id, 'wpcode_auto_insert', 1 );
		update_post_meta( (int) $post_id, '_ctw_snippet_type', $type );
		update_post_meta( (int) $post_id, '_ctw_snippet_location', $location );

		return (int) $post_id;
	}
}
