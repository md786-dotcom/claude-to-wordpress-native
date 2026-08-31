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
require_once dirname( __DIR__ ) . '/includes/elementor/class-full-width.php';
require_once dirname( __DIR__ ) . '/includes/import/class-package-reader.php';
require_once dirname( __DIR__ ) . '/includes/import/class-import-guard.php';
require_once dirname( __DIR__ ) . '/includes/stack/class-parent-theme.php';
require_once dirname( __DIR__ ) . '/includes/stack/class-woo-install-switch.php';
require_once dirname( __DIR__ ) . '/includes/cache/class-cache-purger.php';

$GLOBALS['ctw_test_options'] = array();
$GLOBALS['ctw_test_object_cache'] = array();
$GLOBALS['ctw_test_actions'] = array();
$GLOBALS['ctw_test_flushed'] = array(
	'object_cache'  => 0,
	'theme_cache'   => 0,
	'rewrite_rules' => 0,
	'page_cache'    => 0,
	'elementor'     => 0,
);

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * @param string $key     Option key.
	 * @param mixed  $default Default.
	 * @return mixed
	 */
	function get_option( $key, $default = false ) {
		$cache_key = 'option:' . $key;
		if ( array_key_exists( $cache_key, $GLOBALS['ctw_test_object_cache'] ) ) {
			return $GLOBALS['ctw_test_object_cache'][ $cache_key ];
		}
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
		$GLOBALS['ctw_test_options'][ $key ]                   = $value;
		$GLOBALS['ctw_test_object_cache'][ 'option:' . $key ] = $value;
		return true;
	}
}

if ( ! function_exists( 'get_stylesheet' ) ) {
	/**
	 * Active theme stylesheet, subject to object-cache staleness in tests.
	 */
	function get_stylesheet(): string {
		return (string) get_option( 'stylesheet', '' );
	}
}

if ( ! function_exists( 'add_action' ) ) {
	/**
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback.
	 * @param int      $priority Priority.
	 * @param int      $accepted Accepted args.
	 */
	function add_action( $hook, $callback, $priority = 10, $accepted = 1 ): bool {
		unset( $priority, $accepted );
		if ( ! isset( $GLOBALS['ctw_test_actions'][ $hook ] ) ) {
			$GLOBALS['ctw_test_actions'][ $hook ] = array();
		}
		$GLOBALS['ctw_test_actions'][ $hook ][] = $callback;
		return true;
	}
}

if ( ! function_exists( 'do_action' ) ) {
	/**
	 * @param string $hook Hook name.
	 * @param mixed  ...$args Args.
	 */
	function do_action( $hook, ...$args ): void {
		$callbacks = $GLOBALS['ctw_test_actions'][ $hook ] ?? array();
		foreach ( $callbacks as $callback ) {
			call_user_func_array( $callback, $args );
		}
	}
}

if ( ! function_exists( 'has_action' ) ) {
	/**
	 * @param string $hook Hook name.
	 * @return bool|int
	 */
	function has_action( $hook ) {
		$callbacks = $GLOBALS['ctw_test_actions'][ $hook ] ?? array();
		return count( $callbacks ) > 0 ? count( $callbacks ) : false;
	}
}

if ( ! function_exists( 'wp_cache_flush' ) ) {
	function wp_cache_flush(): bool {
		$GLOBALS['ctw_test_object_cache'] = array();
		$GLOBALS['ctw_test_flushed']['object_cache']++;
		return true;
	}
}

if ( ! function_exists( 'wp_cache_delete' ) ) {
	/**
	 * @param string $key   Cache key.
	 * @param string $group Cache group.
	 */
	function wp_cache_delete( $key, $group = '' ): bool {
		unset( $GLOBALS['ctw_test_object_cache'][ $group . ':' . $key ] );
		return true;
	}
}

if ( ! function_exists( 'wp_clean_themes_cache' ) ) {
	function wp_clean_themes_cache(): void {
		$GLOBALS['ctw_test_flushed']['theme_cache']++;
	}
}

if ( ! function_exists( 'flush_rewrite_rules' ) ) {
	/**
	 * @param bool $hard Hard flush.
	 */
	function flush_rewrite_rules( $hard = true ): void {
		unset( $hard );
		$GLOBALS['ctw_test_flushed']['rewrite_rules']++;
	}
}

if ( ! function_exists( 'wp_cache_clear_cache' ) ) {
	function wp_cache_clear_cache(): void {
		$GLOBALS['ctw_test_flushed']['page_cache']++;
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
