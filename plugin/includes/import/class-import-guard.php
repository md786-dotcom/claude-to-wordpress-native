<?php
/**
 * One-shot import / wipe guards.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Import;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tracks whether a CTW import already ran.
 */
final class Import_Guard {

	public const OPTION_DONE    = 'ctw_native_import_done';
	public const OPTION_CREATED = 'ctw_native_created_ids';

	/**
	 * Whether an import is already recorded.
	 */
	public static function is_done(): bool {
		return (bool) get_option( self::OPTION_DONE, false );
	}

	/**
	 * Mark import complete and store created IDs for wipe.
	 *
	 * @param array{pages?:list<int>,forms?:list<int>,snippets?:list<int>,templates?:list<int>,products?:list<int>} $ids IDs.
	 */
	public static function mark_done( array $ids ): void {
		update_option( self::OPTION_DONE, true, false );
		update_option( self::OPTION_CREATED, $ids, false );
	}

	/**
	 * @return array{pages:list<int>,forms:list<int>,snippets:list<int>,templates:list<int>,products:list<int>}
	 */
	public static function created_ids(): array {
		$raw = get_option( self::OPTION_CREATED, array() );
		if ( ! is_array( $raw ) ) {
			$raw = array();
		}
		return array(
			'pages'     => self::int_list( $raw['pages'] ?? array() ),
			'forms'     => self::int_list( $raw['forms'] ?? array() ),
			'snippets'  => self::int_list( $raw['snippets'] ?? array() ),
			'templates' => self::int_list( $raw['templates'] ?? array() ),
			'products'  => self::int_list( $raw['products'] ?? array() ),
		);
	}

	/**
	 * Delete generated content. Does not touch Customizer custom_css.
	 *
	 * @return true|\WP_Error
	 */
	public static function wipe() {
		$ids = self::created_ids();
		foreach ( array( 'pages', 'forms', 'snippets', 'templates', 'products' ) as $group ) {
			foreach ( $ids[ $group ] as $post_id ) {
				wp_delete_post( $post_id, true );
			}
		}
		delete_option( self::OPTION_DONE );
		delete_option( self::OPTION_CREATED );
		return true;
	}

	/**
	 * Refuse import when already done.
	 *
	 * @return true|\WP_Error
	 */
	public static function assert_can_import() {
		if ( self::is_done() ) {
			return new \WP_Error(
				'ctw_import_done',
				'Import already ran. Wipe generated content before a new import.'
			);
		}
		return true;
	}

	/**
	 * @param mixed $value Raw list.
	 * @return list<int>
	 */
	private static function int_list( $value ): array {
		if ( ! is_array( $value ) ) {
			return array();
		}
		$out = array();
		foreach ( $value as $item ) {
			$out[] = (int) $item;
		}
		return $out;
	}
}
