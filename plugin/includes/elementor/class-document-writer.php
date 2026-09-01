<?php
/**
 * Persists Elementor Free documents (pages and ElementsKit trees).
 *
 * The Elementor meta contract written here (`_elementor_data` and friends) follows
 * the persist pattern used by EMCP Tools, copyright Mian Shahzad Raza (MSR Builds),
 * GPL-2.0-or-later, https://github.com/msrbuilds/elementor-mcp
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
	 * @param string                    $title    Title.
	 * @param string                    $slug     Slug.
	 * @param list<array<string,mixed>> $elements Element tree.
	 * @param int                       $post_id  Existing post id or 0.
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
		self::persist_meta( $id, $elements, 'wp-page', 'elementor_header_footer' );
		return $id;
	}

	/**
	 * Validate Free tree and write Elementor meta for any post type.
	 *
	 * @param int                       $post_id         Post ID.
	 * @param list<array<string,mixed>> $elements        Tree.
	 * @param string                    $template_type   Elementor template type (wp-page|section).
	 * @param string|null               $page_template   Optional _wp_page_template.
	 * @return true|\WP_Error
	 */
	public static function write_elementor_data( int $post_id, array $elements, string $template_type, ?string $page_template = null ) {
		$valid = Tree_Validator::validate( $elements );
		if ( is_wp_error( $valid ) ) {
			return $valid;
		}
		self::persist_meta( $post_id, $elements, $template_type, $page_template );
		return true;
	}

	/**
	 * @param int                       $post_id       Post ID.
	 * @param list<array<string,mixed>> $elements      Tree.
	 * @param string                    $template_type Template type.
	 * @param string|null               $page_template Page template or null.
	 */
	private static function persist_meta( int $post_id, array $elements, string $template_type, ?string $page_template ): void {
		$elements = Full_Width::ensure_tree( $elements );
		$json     = wp_json_encode( $elements );
		update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $post_id, '_elementor_template_type', $template_type );
		update_post_meta( $post_id, '_elementor_data', wp_slash( $json ) );
		update_post_meta( $post_id, '_elementor_version', '0.4' );
		if ( null !== $page_template ) {
			update_post_meta( $post_id, '_wp_page_template', $page_template );
		}
	}
}
