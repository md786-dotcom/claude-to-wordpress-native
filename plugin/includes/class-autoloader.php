<?php
/**
 * PSR-4-ish autoloader for CTW_Native classes.
 *
 * @package CTW_Native
 */

namespace CTW_Native;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Maps CTW_Native\* to includes/.
 */
final class Autoloader {

	/**
	 * Register spl autoload.
	 */
	public static function register(): void {
		spl_autoload_register( array( self::class, 'load' ) );
	}

	/**
	 * @param string $class Fully-qualified class name.
	 */
	public static function load( string $class ): void {
		$prefix = 'CTW_Native\\';
		if ( 0 !== strpos( $class, $prefix ) ) {
			return;
		}
		$relative = substr( $class, strlen( $prefix ) );
		$relative = strtolower( str_replace( '_', '-', $relative ) );
		$relative = str_replace( '\\', '/', $relative );
		$path     = CTW_NATIVE_PATH . 'includes/class-' . str_replace( '/', '/class-', $relative ) . '.php';

		// Nested: Admin\Setup_Page -> includes/admin/class-setup-page.php
		$parts = explode( '/', $relative );
		if ( count( $parts ) > 1 ) {
			$file = array_pop( $parts );
			$path = CTW_NATIVE_PATH . 'includes/' . implode( '/', $parts ) . '/class-' . $file . '.php';
		} else {
			$path = CTW_NATIVE_PATH . 'includes/class-' . $relative . '.php';
		}

		if ( is_readable( $path ) ) {
			require_once $path;
		}
	}
}
