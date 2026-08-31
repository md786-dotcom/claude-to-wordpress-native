<?php
/**
 * CTW Native setup admin page.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Admin;

use CTW_Native\Import\Import_Guard;
use CTW_Native\Import\Importer;
use CTW_Native\Import\Package_Reader;
use CTW_Native\Stack\Stack_Installer;
use CTW_Native\Stack\Woo_Install_Switch;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Setup wizard UI.
 */
final class Setup_Page {

	public const SLUG = 'ctw-native-setup';

	/**
	 * Register menu and actions.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_post_ctw_native_install', array( $this, 'handle_install' ) );
		add_action( 'admin_post_ctw_native_import', array( $this, 'handle_import' ) );
		add_action( 'admin_post_ctw_native_wipe', array( $this, 'handle_wipe' ) );
	}

	/**
	 * Add top-level menu.
	 */
	public function menu(): void {
		add_menu_page(
			'CTW Native',
			'CTW Native',
			'manage_options',
			self::SLUG,
			array( $this, 'render' ),
			'dashicons-art',
			58
		);
	}

	/**
	 * Render setup screen.
	 */
	public function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You cannot access this page.', 'ctw-native' ) );
		}

		$package     = Package_Reader::read();
		$package_woo = is_array( $package ) && Package_Reader::woo_enabled( $package );
		$want_woo    = Woo_Install_Switch::should_install( is_wp_error( $package ) ? null : $package );
		$plugins     = Package_Reader::install_plugins( is_wp_error( $package ) ? null : $package, $want_woo );

		$installer = new Stack_Installer();
		$rows      = $installer->status_rows( $plugins );
		$notice    = isset( $_GET['ctw_notice'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['ctw_notice'] ) ) : '';

		echo '<div class="wrap"><h1>CTW Native Setup</h1>';
		if ( '' !== $notice ) {
			echo '<div class="notice notice-info"><p>' . esc_html( $notice ) . '</p></div>';
		}

		echo '<p>Install Hello Elementor and the declared free plugins, then import <code>ctw-package.json</code> from the active child theme.</p>';
		echo '<p>Theme changes automatically purge WordPress, Elementor, and common page caches so the newly activated theme is shown.</p>';
		echo '<p><strong>Claude Code</strong> generates the child ZIP. Claude cannot edit this site after import.</p>';

		echo '<h2>Stack status</h2><ul>';
		foreach ( $rows as $row ) {
			$mark = $row['ok'] ? 'OK' : 'Missing';
			echo '<li><strong>' . esc_html( $row['label'] ) . '</strong>: ' . esc_html( $mark ) . ' — ' . esc_html( $row['detail'] ) . '</li>';
		}
		echo '</ul>';

		if ( is_wp_error( $package ) ) {
			echo '<div class="notice notice-warning"><p>' . esc_html( $package->get_error_message() ) . '</p></div>';
		} else {
			$woo = $package_woo ? 'yes' : 'no';
			echo '<p>Package found. WooCommerce in package: <strong>' . esc_html( $woo ) . '</strong>.</p>';
		}

		echo '<h2>Actions</h2>';
		$this->render_install_form( $package_woo, $want_woo );
		$this->action_button( 'ctw_native_import', 'Import package (one-shot)', 'publish_pages' );
		if ( Import_Guard::is_done() ) {
			echo '<p>Import already completed. Wipe before a new import. Wipe does not delete Appearance → Customize → Additional CSS.</p>';
			$this->action_button( 'ctw_native_wipe', 'Wipe generated content', 'delete_pages' );
		}

		echo '<h2>Client editing</h2><ul>';
		echo '<li>Pages and posts: Edit with Elementor (Free)</li>';
		echo '<li>Header and footer: ElementsKit</li>';
		echo '<li>Shop: WooCommerce PHP templates (when enabled)</li>';
		echo '<li>Extra CSS: Appearance → Customize → Additional CSS</li>';
		echo '</ul></div>';
	}

	/**
	 * Install form with WooCommerce switch.
	 *
	 * @param bool $package_woo Package requires Woo.
	 * @param bool $checked     Checkbox state.
	 */
	private function render_install_form( bool $package_woo, bool $checked ): void {
		$can = current_user_can( 'install_plugins' );
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin:1em 0;padding:1em;border:1px solid #c3c4c7;background:#fff;max-width:40rem;">';
		echo '<input type="hidden" name="action" value="ctw_native_install" />';
		wp_nonce_field( 'ctw_native_install' );
		echo '<p><label><input type="checkbox"';
		if ( ! $package_woo ) {
			echo ' name="ctw_install_woocommerce" value="1"';
		}
		checked( $checked );
		disabled( $package_woo );
		echo ' /> <strong>Install WooCommerce</strong></label></p>';
		if ( $package_woo ) {
			echo '<p class="description">Required by this package (<code>woocommerce.enabled</code>). The switch stays on.</p>';
			echo '<input type="hidden" name="ctw_install_woocommerce" value="1" />';
		} else {
			echo '<p class="description">Turn on to download and activate WooCommerce from wordpress.org with the rest of the stack. Claude Code can also set <code>woocommerce.enabled: true</code> in the package.</p>';
		}
		$disabled = $can ? '' : ' disabled';
		echo '<p><button type="submit" class="button button-primary"' . esc_attr( $disabled ) . '>Install / activate stack</button></p>';
		echo '</form>';
	}

	/**
	 * @param string $action Action name.
	 * @param string $label  Button label.
	 * @param string $cap    Capability.
	 */
	private function action_button( string $action, string $label, string $cap ): void {
		$url = wp_nonce_url(
			admin_url( 'admin-post.php?action=' . rawurlencode( $action ) ),
			$action
		);
		$disabled = current_user_can( $cap ) ? '' : ' disabled';
		echo '<p><a class="button button-primary' . esc_attr( $disabled ) . '" href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></p>';
	}

	/**
	 * Install stack handler.
	 */
	public function handle_install(): void {
		$this->verify( 'ctw_native_install', 'install_plugins' );
		$package     = Package_Reader::read();
		$package_woo = is_array( $package ) && Package_Reader::woo_enabled( $package );
		$posted_woo  = isset( $_POST['ctw_install_woocommerce'] ) && '1' === (string) wp_unslash( (string) $_POST['ctw_install_woocommerce'] );
		$install_woo = Woo_Install_Switch::resolve( $package_woo, $posted_woo );
		Woo_Install_Switch::set_enabled( $install_woo );

		$plugins   = Package_Reader::install_plugins( is_wp_error( $package ) ? null : $package, $install_woo );
		$installer = new Stack_Installer();
		$result    = $installer->install_all( $plugins );
		if ( is_wp_error( $result ) ) {
			$this->redirect( $result->get_error_message() );
		}
		$msg = $install_woo
			? 'Stack installed (including WooCommerce).'
			: 'Stack installed.';
		$this->redirect( $msg );
	}

	/**
	 * Import handler.
	 */
	public function handle_import(): void {
		$this->verify( 'ctw_native_import', 'publish_pages' );
		$importer = new Importer();
		$result   = $importer->run();
		$msg      = is_wp_error( $result ) ? $result->get_error_message() : 'Import complete.';
		$this->redirect( $msg );
	}

	/**
	 * Wipe handler.
	 */
	public function handle_wipe(): void {
		$this->verify( 'ctw_native_wipe', 'delete_pages' );
		Import_Guard::wipe();
		$this->redirect( 'Generated content wiped. Customizer Additional CSS was kept.' );
	}

	/**
	 * @param string $action Action.
	 * @param string $cap    Cap.
	 */
	private function verify( string $action, string $cap ): void {
		if ( ! current_user_can( $cap ) ) {
			wp_die( esc_html__( 'Forbidden.', 'ctw-native' ) );
		}
		check_admin_referer( $action );
	}

	/**
	 * @param string $notice Notice text.
	 */
	private function redirect( string $notice ): void {
		wp_safe_redirect(
			add_query_arg(
				array(
					'page'       => self::SLUG,
					'ctw_notice' => rawurlencode( $notice ),
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
}
