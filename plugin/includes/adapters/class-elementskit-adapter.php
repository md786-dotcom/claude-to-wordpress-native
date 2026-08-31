<?php
/**
 * ElementsKit Header Footer adapter.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

use CTW_Native\Import\Media_Sideloader;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates ElementsKit templates when the plugin is active.
 */
final class ElementsKit_Adapter {

	/**
	 * @param mixed           $template Header/footer payload or null.
	 * @param string          $type     header|footer.
	 * @param Media_Sideloader $media   Media rewriter.
	 * @return int|\WP_Error Template post ID or 0 when skipped.
	 */
	public static function import_template( $template, string $type, Media_Sideloader $media ) {
		if ( ! is_array( $template ) ) {
			return 0;
		}
		if ( ! self::is_available() ) {
			return new \WP_Error( 'ctw_ek_missing', 'ElementsKit Lite is not active.' );
		}

		$title    = isset( $template['title'] ) ? (string) $template['title'] : ucfirst( $type );
		$elements = isset( $template['elements'] ) && is_array( $template['elements'] ) ? $template['elements'] : array();
		$elements = $media->rewrite_tree( $elements );

		$post_id = wp_insert_post(
			array(
				'post_title'  => $title,
				'post_status' => 'publish',
				'post_type'   => self::post_type(),
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		update_post_meta( (int) $post_id, 'elementskit_template_type', $type );
		update_post_meta( (int) $post_id, 'elementskit_template_activation', 'yes' );
		update_post_meta( (int) $post_id, 'elementskit_template_condition', array( 'entire_site' ) );
		update_post_meta( (int) $post_id, '_elementor_edit_mode', 'builder' );
		update_post_meta( (int) $post_id, '_elementor_data', wp_slash( wp_json_encode( $elements ) ) );
		update_post_meta( (int) $post_id, '_elementor_template_type', 'section' );

		return (int) $post_id;
	}

	/**
	 * Whether ElementsKit is available.
	 */
	public static function is_available(): bool {
		return post_type_exists( self::post_type() ) || defined( 'ELEMENTSKIT_VERSION' ) || class_exists( '\\ElementsKit_Lite' );
	}

	/**
	 * CPT used by ElementsKit Header Footer.
	 */
	public static function post_type(): string {
		return 'elementskit_template';
	}
}
