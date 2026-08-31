<?php
/**
 * Free Elementor widget allowlist.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

use CTW_Native\Contract\Package_Contract;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rejects Pro / unknown widgets. Delegates to Package_Contract.
 */
final class Widget_Allowlist {

	/**
	 * @return list<string>
	 */
	public static function all(): array {
		return Package_Contract::free_widgets();
	}

	/**
	 * @param string $widget_type Widget type slug.
	 */
	public static function is_allowed( string $widget_type ): bool {
		return Package_Contract::is_free_widget( $widget_type );
	}
}
