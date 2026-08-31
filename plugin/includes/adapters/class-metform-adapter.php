<?php
/**
 * MetForm adapter.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates MetForm forms when the plugin is active.
 */
final class MetForm_Adapter {

	/**
	 * @param mixed $forms Forms list.
	 * @return list<int>|\WP_Error
	 */
	public static function import_forms( $forms ) {
		if ( ! is_array( $forms ) || empty( $forms ) ) {
			return array();
		}
		if ( ! self::is_available() ) {
			return new \WP_Error( 'ctw_metform_missing', 'MetForm is not active.' );
		}

		$ids = array();
		foreach ( $forms as $form ) {
			if ( ! is_array( $form ) ) {
				continue;
			}
			$title  = isset( $form['title'] ) ? (string) $form['title'] : 'Form';
			$slug   = isset( $form['slug'] ) ? (string) $form['slug'] : '';
			$fields = isset( $form['fields'] ) && is_array( $form['fields'] ) ? $form['fields'] : array();

			$post_id = wp_insert_post(
				array(
					'post_title'  => $title,
					'post_name'   => $slug,
					'post_status' => 'publish',
					'post_type'   => self::post_type(),
				),
				true
			);
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			update_post_meta( (int) $post_id, 'metform_fields', $fields );
			$ids[] = (int) $post_id;
		}
		return $ids;
	}

	/**
	 * Whether MetForm CPT exists.
	 */
	public static function is_available(): bool {
		return post_type_exists( self::post_type() ) || class_exists( '\\MetForm\\Plugin' );
	}

	/**
	 * MetForm post type.
	 */
	public static function post_type(): string {
		return 'metform-form';
	}
}
