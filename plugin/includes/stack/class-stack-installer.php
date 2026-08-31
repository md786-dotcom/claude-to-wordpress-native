<?php
/**
 * TGM-style installer for Hello + declared plugins from wordpress.org.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Stack;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Stack installer.
 */
final class Stack_Installer {

	/**
	 * Plugin slug => main file relative to wp-content/plugins.
	 *
	 * @var array<string,string>
	 */
	private const PLUGIN_MAINS = array(
		'elementor'                  => 'elementor/elementor.php',
		'woocommerce'                => 'woocommerce/woocommerce.php',
		'elementskit-lite'           => 'elementskit-lite/elementskit-lite.php',
		'metform'                    => 'metform/metform.php',
		'insert-headers-and-footers' => 'insert-headers-and-footers/ihaf.php',
	);

	/**
	 * Install and activate Hello parent + plugin list.
	 *
	 * @param list<string> $plugin_slugs Declared plugins.
	 * @return array{ok:bool,messages:list<string>}|\WP_Error
	 */
	public function install_all( array $plugin_slugs ) {
		if ( ! current_user_can( 'install_plugins' ) ) {
			return new \WP_Error( 'ctw_cap', 'install_plugins capability is required.' );
		}
		if ( ! current_user_can( 'switch_themes' ) ) {
			return new \WP_Error( 'ctw_cap_theme', 'switch_themes capability is required.' );
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/theme.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$messages = array();

		$theme_result = $this->ensure_hello();
		if ( is_wp_error( $theme_result ) ) {
			return $theme_result;
		}
		$messages[] = 'Hello Elementor is ready.';

		foreach ( $plugin_slugs as $slug ) {
			$result = $this->ensure_plugin( $slug );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			$messages[] = sprintf( 'Plugin ready: %s', $slug );
		}

		return array(
			'ok'       => true,
			'messages' => $messages,
		);
	}

	/**
	 * @return true|\WP_Error
	 */
	private function ensure_hello() {
		if ( ! Parent_Theme::is_installed() ) {
			$skin     = new \Automatic_Upgrader_Skin();
			$upgrader = new \Theme_Upgrader( $skin );
			$result   = $upgrader->install( $this->theme_zip_url( Parent_Theme::SLUG ) );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			if ( true !== $result && null !== $result ) {
				// Theme_Upgrader::install returns true|WP_Error|null depending on WP version.
				if ( false === $result ) {
					return new \WP_Error( 'ctw_theme_install', 'Hello Elementor install failed.' );
				}
			}
		}
		return true;
	}

	/**
	 * @param string $slug Plugin slug.
	 * @return true|\WP_Error
	 */
	private function ensure_plugin( string $slug ) {
		if ( ! isset( self::PLUGIN_MAINS[ $slug ] ) ) {
			return new \WP_Error( 'ctw_unknown_plugin', 'Unknown plugin slug: ' . $slug );
		}
		$main = self::PLUGIN_MAINS[ $slug ];

		if ( ! $this->plugin_installed( $main ) ) {
			$api = plugins_api(
				'plugin_information',
				array(
					'slug'   => $slug,
					'fields' => array( 'sections' => false ),
				)
			);
			if ( is_wp_error( $api ) ) {
				return $api;
			}
			$skin     = new \Automatic_Upgrader_Skin();
			$upgrader = new \Plugin_Upgrader( $skin );
			$result   = $upgrader->install( $api->download_link );
			if ( is_wp_error( $result ) || false === $result ) {
				return is_wp_error( $result ) ? $result : new \WP_Error( 'ctw_plugin_install', 'Install failed: ' . $slug );
			}
		}

		if ( ! is_plugin_active( $main ) ) {
			$activate = activate_plugin( $main );
			if ( is_wp_error( $activate ) ) {
				return $activate;
			}
		}
		return true;
	}

	/**
	 * @param string $main Main plugin file.
	 */
	private function plugin_installed( string $main ): bool {
		$plugins = get_plugins();
		return isset( $plugins[ $main ] );
	}

	/**
	 * @param string $slug Theme slug.
	 */
	private function theme_zip_url( string $slug ): string {
		return 'https://downloads.wordpress.org/theme/' . rawurlencode( $slug ) . '.latest-stable.zip';
	}

	/**
	 * Status rows for the setup UI.
	 *
	 * @param list<string> $plugin_slugs Declared plugins.
	 * @return list<array{label:string,ok:bool,detail:string}>
	 */
	public function status_rows( array $plugin_slugs ): array {
		$rows   = array();
		$rows[] = array(
			'label'  => 'Hello Elementor (parent)',
			'ok'     => Parent_Theme::is_installed(),
			'detail' => Parent_Theme::is_hello_family_active() ? 'Active family' : 'Installed or missing',
		);
		foreach ( $plugin_slugs as $slug ) {
			$main = self::PLUGIN_MAINS[ $slug ] ?? '';
			$ok   = '' !== $main && $this->plugin_installed( $main ) && is_plugin_active( $main );
			$rows[] = array(
				'label'  => $slug,
				'ok'     => $ok,
				'detail' => $ok ? 'Active' : 'Missing or inactive',
			);
		}
		return $rows;
	}
}
