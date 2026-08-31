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
require_once dirname( __DIR__ ) . '/includes/stack/class-woo-install-switch.php';

$GLOBALS['ctw_test_options'] = array();

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * @param string $key     Option key.
	 * @param mixed  $default Default.
	 * @return mixed
	 */
	function get_option( $key, $default = false ) {
		return array_key_exists( $key, $GLOBALS['ctw_test_options'] )
			? $GLOBALS['ctw_test_options'][ $key ]
			: $default;
	}
}

if ( ! function_exists( 'update_option' ) ) {
	/**
	 * @param string $key   Option key.
	 * @param mixed  $value Value.
	 * @param mixed  $autoload Autoload flag.
	 */
	function update_option( $key, $value, $autoload = true ): bool {
		unset( $autoload );
		$GLOBALS['ctw_test_options'][ $key ] = $value;
		return true;
	}
}

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
