<?php
/**
 * Reads ctw-package.json from the active child theme.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Import;

use CTW_Native\Contract\Package_Contract;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Package reader.
 */
final class Package_Reader {

	public const FILENAME = 'ctw-package.json';

	/**
	 * Absolute path to package in active stylesheet, or empty.
	 */
	public static function path(): string {
		$path = trailingslashit( get_stylesheet_directory() ) . self::FILENAME;
		return is_readable( $path ) ? $path : '';
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function read() {
		$path = self::path();
		if ( '' === $path ) {
			return new \WP_Error( 'ctw_no_package', 'ctw-package.json was not found in the active child theme.' );
		}
		$raw = file_get_contents( $path );
		if ( false === $raw ) {
			return new \WP_Error( 'ctw_read_fail', 'Could not read ctw-package.json.' );
		}
		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) ) {
			return new \WP_Error( 'ctw_bad_json', 'ctw-package.json is not valid JSON.' );
		}
		$check = self::validate_shape( $data );
		if ( is_wp_error( $check ) ) {
			return $check;
		}
		return $data;
	}

	/**
	 * Lightweight shape checks (full Zod validation happens in the CLI).
	 *
	 * @param array<string,mixed> $data Package.
	 * @return true|\WP_Error
	 */
	public static function validate_shape( array $data ) {
		if ( ! isset( $data['version'] ) || 1 !== (int) $data['version'] ) {
			return new \WP_Error( 'ctw_version', 'Package version must be 1.' );
		}
		if ( empty( $data['theme'] ) || ! is_array( $data['theme'] ) ) {
			return new \WP_Error( 'ctw_theme', 'Package theme is required.' );
		}
		if ( empty( $data['pages'] ) || ! is_array( $data['pages'] ) ) {
			return new \WP_Error( 'ctw_pages', 'Package pages are required.' );
		}
		if ( isset( $data['snippets'] ) && is_array( $data['snippets'] ) ) {
			foreach ( $data['snippets'] as $snippet ) {
				if ( ! is_array( $snippet ) ) {
					continue;
				}
				$type = isset( $snippet['type'] ) ? (string) $snippet['type'] : '';
				if ( 'php' === $type ) {
					return new \WP_Error( 'ctw_php_snippet', 'PHP snippets are rejected.' );
				}
				if ( '' !== $type && ! Package_Contract::is_snippet_type( $type ) ) {
					return new \WP_Error( 'ctw_bad_snippet', 'Snippet type is not allowed: ' . $type );
				}
			}
		}
		return true;
	}

	/**
	 * @param array<string,mixed> $data Package.
	 */
	public static function woo_enabled( array $data ): bool {
		if ( empty( $data['woocommerce'] ) || ! is_array( $data['woocommerce'] ) ) {
			return false;
		}
		return ! empty( $data['woocommerce']['enabled'] );
	}

	/**
	 * Declared plugin slugs for the installer.
	 *
	 * @param array<string,mixed> $data Package.
	 * @return list<string>
	 */
	public static function declared_plugins( array $data ): array {
		return Package_Contract::declared_plugins( self::woo_enabled( $data ) );
	}

	/**
	 * Plugin slugs for stack install, honoring package woo and/or an explicit switch.
	 *
	 * @param array<string,mixed>|\WP_Error|null $package Package or missing.
	 * @param bool                               $install_woo Effective WooCommerce install flag.
	 * @return list<string>
	 */
	public static function install_plugins( $package, bool $install_woo ): array {
		if ( is_array( $package ) && self::woo_enabled( $package ) ) {
			$install_woo = true;
		}
		return Package_Contract::declared_plugins( $install_woo );
	}
}
