<?php
/**
 * Persists Elementor Free page documents.
 *
 * Adapted from EMCP Tools document persist patterns (GPL-2.0-or-later).
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Writes Elementor meta so Edit with Elementor works.
 */
final class Document_Writer {

	/**
	 * Create or update a page with Elementor Free data.
	 *
	 * @param string                $title    Title.
	 * @param string                $slug     Slug.
	 * @param list<array<string,mixed>> $elements Element tree.
	 * @param int                   $post_id  Existing post id or 0.
	 * @return int|\WP_Error Post ID.
	 */
	public static function write_page( string $title, string $slug, array $elements, int $post_id = 0 ) {
		$valid = Tree_Validator::validate( $elements );
		if ( is_wp_error( $valid ) ) {
			return $valid;
		}

		$payload = array(
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_content' => '',
		);

		if ( $post_id > 0 ) {
			$payload['ID'] = $post_id;
			$result        = wp_update_post( $payload, true );
		} else {
			$result = wp_insert_post( $payload, true );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$id = (int) $result;
		self::write_meta( $id, $elements );
		return $id;
	}

	/**
	 * @param int                       $post_id  Post ID.
	 * @param list<array<string,mixed>> $elements Tree.
	 */
	public static function write_meta( int $post_id, array $elements ): void {
		$json = wp_json_encode( $elements );
		update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $post_id, '_elementor_template_type', 'wp-page' );
		update_post_meta( $post_id, '_elementor_data', wp_slash( $json ) );
		update_post_meta( $post_id, '_elementor_version', '0.4' );
		update_post_meta( $post_id, '_wp_page_template', 'elementor_header_footer' );
	}
}
