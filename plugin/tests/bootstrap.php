<?php
/**
 * PHPUnit bootstrap without full WordPress.
 *
 * @package CTW_Native
 */

define( 'ABSPATH', __DIR__ . '/../../' );
define( 'CTW_NATIVE_VERSION', '0.1.0' );
define( 'CTW_NATIVE_FILE', dirname( __DIR__ ) . '/ctw-native.php' );
define( 'CTW_NATIVE_PATH', dirname( __DIR__ ) . '/' );
define( 'CTW_NATIVE_URL', 'http://example.test/wp-content/plugins/ctw-native/' );

require_once dirname( __DIR__ ) . '/includes/contract/class-package-contract.php';
require_once dirname( __DIR__ ) . '/includes/elementor/class-widget-allowlist.php';
require_once dirname( __DIR__ ) . '/includes/elementor/class-tree-validator.php';
require_once dirname( __DIR__ ) . '/includes/import/class-package-reader.php';
require_once dirname( __DIR__ ) . '/includes/import/class-import-guard.php';
require_once dirname( __DIR__ ) . '/includes/stack/class-parent-theme.php';

if ( ! class_exists( 'WP_Error' ) ) {
	/**
	 * Minimal WP_Error stub for unit tests.
	 */
	class WP_Error {
		/** @var string */
		public $code;
		/** @var string */
		public $message;

		public function __construct( string $code = '', string $message = '' ) {
			$this->code    = $code;
			$this->message = $message;
		}

		public function get_error_message(): string {
			return $this->message;
		}

		public function get_error_code(): string {
			return $this->code;
		}
	}
}

if ( ! function_exists( 'is_wp_error' ) ) {
	/**
	 * @param mixed $thing Value.
	 */
	function is_wp_error( $thing ): bool {
		return $thing instanceof WP_Error;
	}
}
