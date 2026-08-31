<?php
/**
 * Ensures Hello Elementor is the parent theme.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Stack;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Parent theme helpers.
 */
final class Parent_Theme {

	public const SLUG = 'hello-elementor';

	/**
	 * Whether Hello is installed on disk.
	 */
	public static function is_installed(): bool {
		$theme = wp_get_theme( self::SLUG );
		return $theme->exists();
	}

	/**
	 * Whether the active theme is a Hello child or Hello itself.
	 */
	public static function is_hello_family_active(): bool {
		return self::SLUG === get_template();
	}

	/**
	 * Fail closed unless Hello is the parent of the active theme.
	 *
	 * @return true|\WP_Error
	 */
	public static function assert_hello_parent() {
		if ( ! self::is_hello_family_active() ) {
			return new \WP_Error(
				'ctw_parent',
				'Active theme parent must be hello-elementor.'
			);
		}
		return true;
	}
}
