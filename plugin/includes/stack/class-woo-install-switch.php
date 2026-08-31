<?php
/**
 * Admin switch: include WooCommerce in the stack installer.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Stack;

use CTW_Native\Import\Package_Reader;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Persisted Setup toggle + package gate for WooCommerce install.
 */
final class Woo_Install_Switch {

	public const OPTION = 'ctw_native_install_woocommerce';

	/**
	 * Whether the admin Setup switch is on.
	 */
	public static function is_enabled(): bool {
		return (bool) get_option( self::OPTION, false );
	}

	/**
	 * Persist the Setup switch.
	 *
	 * @param bool $enabled Switch value.
	 */
	public static function set_enabled( bool $enabled ): void {
		update_option( self::OPTION, $enabled ? 1 : 0, false );
	}

	/**
	 * Effective Woo install: package.woocommerce.enabled OR admin switch.
	 *
	 * @param array<string,mixed>|\WP_Error|null $package Package, error, or null when absent.
	 */
	public static function should_install( $package ): bool {
		$from_package = is_array( $package ) && Package_Reader::woo_enabled( $package );
		return $from_package || self::is_enabled();
	}

	/**
	 * Pure resolve helper (package flag OR explicit switch).
	 *
	 * @param bool $package_woo Package woocommerce.enabled.
	 * @param bool $admin_switch Setup checkbox / option.
	 */
	public static function resolve( bool $package_woo, bool $admin_switch ): bool {
		return $package_woo || $admin_switch;
	}
}
