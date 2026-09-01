<?php
/**
 * Plugin Name: CTW Native
 * Plugin URI: https://github.com/md786-dotcom/claude-to-wordpress-native
 * Description: Installs Hello Elementor and the declared free stack, then imports a CTW child theme package for Elementor Free editing.
 * Version: 0.2.1
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * Author: md786-dotcom
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: ctw-native
 *
 * @package CTW_Native
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CTW_NATIVE_VERSION', '0.2.1' );
define( 'CTW_NATIVE_FILE', __FILE__ );
define( 'CTW_NATIVE_PATH', plugin_dir_path( __FILE__ ) );
define( 'CTW_NATIVE_URL', plugin_dir_url( __FILE__ ) );

require_once CTW_NATIVE_PATH . 'includes/class-plugin.php';

/**
 * Bootstrap the plugin.
 */
function ctw_native(): \CTW_Native\Plugin {
	return \CTW_Native\Plugin::instance();
}

ctw_native();
