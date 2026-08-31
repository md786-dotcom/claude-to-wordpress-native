<?php
/**
 * CTW Native setup admin page.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Admin;

use CTW_Native\Contract\Package_Contract;
use CTW_Native\Import\Import_Guard;
use CTW_Native\Import\Importer;
use CTW_Native\Import\Package_Reader;
use CTW_Native\Stack\Stack_Installer;

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

		$package = Package_Reader::read();
		$plugins = is_wp_error( $package )
			? Package_Contract::core_plugins()
			: Package_Reader::declared_plugins( $package );

		$installer = new Stack_Installer();
		$rows      = $installer->status_rows( $plugins );
		$notice    = isset( $_GET['ctw_notice'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['ctw_notice'] ) ) : '';

		echo '<div class="wrap"><h1>CTW Native Setup</h1>';
		if ( '' !== $notice ) {
			echo '<div class="notice notice-info"><p>' . esc_html( $notice ) . '</p></div>';
		}

		echo '<p>Install Hello Elementor and the declared free plugins, then import <code>ctw-package.json</code> from the active child theme.</p>';
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
			$woo = Package_Reader::woo_enabled( $package ) ? 'yes' : 'no';
			echo '<p>Package found. WooCommerce enabled: <strong>' . esc_html( $woo ) . '</strong>.</p>';
		}

		echo '<h2>Actions</h2>';
		$this->action_button( 'ctw_native_install', 'Install / activate stack', 'install_plugins' );
		$this->action_button( 'ctw_native_import', 'Import package (one-shot)', 'publish_pages' );
		if ( Import_Guard::is_done() ) {
			echo '<p>Import already completed. Wipe before a new import. Wipe does not delete Appearance → Customize → Additional CSS.</p>';
			$this->action_button( 'ctw_native_wipe', 'Wipe generated content', 'delete_pages' );
		}

		echo '<h2>Client editing</h2><ul>';
		echo '<li>Pages and posts: Edit with Elementor (Free)</li>';
		echo '<li>Header and footer: ElementsKit</li>';
		echo '<li>Shop: native WooCommerce templates (when enabled)</li>';
		echo '<li>Extra CSS: Appearance → Customize → Additional CSS</li>';
		echo '</ul></div>';
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
		$package = Package_Reader::read();
		$plugins = is_wp_error( $package )
			? Package_Contract::core_plugins()
			: Package_Reader::declared_plugins( $package );
		$installer = new Stack_Installer();
		$result    = $installer->install_all( $plugins );
		$msg       = is_wp_error( $result ) ? $result->get_error_message() : 'Stack installed.';
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
