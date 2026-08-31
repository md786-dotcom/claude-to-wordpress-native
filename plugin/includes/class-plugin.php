<?php
/**
 * Plugin bootstrap.
 *
 * @package CTW_Native
 */

namespace CTW_Native;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once CTW_NATIVE_PATH . 'includes/class-autoloader.php';
Autoloader::register();

/**
 * Main plugin class.
 */
final class Plugin {

	/**
	 * Singleton.
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * @return self
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Wire hooks.
	 */
	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'boot' ) );
	}

	/**
	 * Load cache purge hooks and admin UI after plugins load.
	 */
	public function boot(): void {
		Cache\Cache_Purger::register();
		if ( is_admin() ) {
			$admin = new Admin\Setup_Page();
			$admin->register();
		}
	}
}
