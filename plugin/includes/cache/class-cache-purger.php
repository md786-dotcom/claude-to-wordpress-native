<?php
/**
 * Purges caches so theme and Elementor changes appear immediately.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Clears WordPress, Elementor, and common page-cache layers.
 *
 * Registered on `after_switch_theme` so activating any theme (CTW child or not)
 * does not leave visitors on a stale cached stylesheet.
 */
final class Cache_Purger {

	/**
	 * Wire automatic purge on theme switch.
	 */
	public static function register(): void {
		add_action( 'after_switch_theme', array( self::class, 'on_theme_switched' ), 10, 2 );
	}

	/**
	 * Callback for `after_switch_theme`.
	 *
	 * @param string        $new_name  New theme name / stylesheet.
	 * @param \WP_Theme|null $old_theme Previous theme object when available.
	 * @return array{cleared: list<string>, stylesheet: string}
	 */
	public static function on_theme_switched( $new_name, $old_theme = null ): array {
		unset( $old_theme );
		return self::purge( 'theme_switch', (string) $new_name );
	}

	/**
	 * Purge all known cache layers.
	 *
	 * @param string $reason     Why purge ran (theme_switch|import|manual).
	 * @param string $stylesheet Optional stylesheet slug for bookkeeping.
	 * @return array{cleared: list<string>, stylesheet: string, reason: string}
	 */
	public static function purge( string $reason = 'manual', string $stylesheet = '' ): array {
		$cleared = array();

		if ( '' === $stylesheet && function_exists( 'get_stylesheet' ) ) {
			$stylesheet = (string) get_stylesheet();
		}

		if ( self::purge_object_cache() ) {
			$cleared[] = 'object_cache';
		}
		if ( self::purge_theme_cache() ) {
			$cleared[] = 'theme_cache';
		}
		if ( self::purge_rewrite_rules() ) {
			$cleared[] = 'rewrite_rules';
		}
		if ( self::purge_elementor() ) {
			$cleared[] = 'elementor';
		}
		if ( self::purge_page_caches() ) {
			$cleared[] = 'page_cache';
		}

		/**
		 * Fires after CTW Native clears caches.
		 *
		 * @param list<string> $cleared    Layers cleared.
		 * @param string       $reason     Purge reason.
		 * @param string       $stylesheet Active or target stylesheet.
		 */
		if ( function_exists( 'do_action' ) ) {
			do_action( 'ctw_native_cache_purged', $cleared, $reason, $stylesheet );
		}

		return array(
			'cleared'    => $cleared,
			'stylesheet' => $stylesheet,
			'reason'     => $reason,
		);
	}

	/**
	 * Live stylesheet after a purge (never a stale object-cache hit).
	 */
	public static function displayed_stylesheet(): string {
		self::purge_object_cache();
		self::purge_theme_cache();
		if ( function_exists( 'get_stylesheet' ) ) {
			return (string) get_stylesheet();
		}
		if ( function_exists( 'get_option' ) ) {
			return (string) get_option( 'stylesheet', '' );
		}
		return '';
	}

	/**
	 * @return bool True when a flush was attempted.
	 */
	private static function purge_object_cache(): bool {
		if ( ! function_exists( 'wp_cache_flush' ) ) {
			return false;
		}
		wp_cache_flush();
		return true;
	}

	/**
	 * @return bool True when theme caches were cleared.
	 */
	private static function purge_theme_cache(): bool {
		$did = false;
		if ( function_exists( 'wp_clean_themes_cache' ) ) {
			wp_clean_themes_cache();
			$did = true;
		}
		if ( function_exists( 'wp_cache_delete' ) ) {
			wp_cache_delete( 'theme_roots', 'themes' );
			$did = true;
		}
		return $did;
	}

	/**
	 * Soft flush so pretty permalinks match the active theme.
	 *
	 * @return bool
	 */
	private static function purge_rewrite_rules(): bool {
		if ( ! function_exists( 'flush_rewrite_rules' ) ) {
			return false;
		}
		flush_rewrite_rules( false );
		return true;
	}

	/**
	 * Clear Elementor CSS / file cache when Elementor is loaded.
	 *
	 * @return bool
	 */
	private static function purge_elementor(): bool {
		if ( ! class_exists( '\Elementor\Plugin' ) ) {
			return false;
		}
		try {
			$plugin = \Elementor\Plugin::$instance;
			if ( isset( $plugin->files_manager ) && is_object( $plugin->files_manager ) ) {
				if ( method_exists( $plugin->files_manager, 'clear_cache' ) ) {
					$plugin->files_manager->clear_cache();
					return true;
				}
			}
		} catch ( \Throwable $e ) {
			unset( $e );
		}
		return false;
	}

	/**
	 * Best-effort purge for popular page / opcode caches.
	 *
	 * @return bool True when at least one known cache API was invoked.
	 */
	private static function purge_page_caches(): bool {
		$did = false;

		if ( function_exists( 'wp_cache_clear_cache' ) ) {
			wp_cache_clear_cache();
			$did = true;
		}
		if ( function_exists( 'w3tc_flush_all' ) ) {
			w3tc_flush_all();
			$did = true;
		}
		if ( function_exists( 'rocket_clean_domain' ) ) {
			rocket_clean_domain();
			$did = true;
		}
		if ( class_exists( '\LiteSpeed\Purge' ) && method_exists( '\LiteSpeed\Purge', 'purge_all' ) ) {
			\LiteSpeed\Purge::purge_all();
			$did = true;
		} elseif ( function_exists( 'has_action' ) && has_action( 'litespeed_purge_all' ) ) {
			do_action( 'litespeed_purge_all' );
			$did = true;
		}
		if ( class_exists( 'autoptimizeCache' ) && method_exists( 'autoptimizeCache', 'clearall' ) ) {
			\autoptimizeCache::clearall();
			$did = true;
		}
		if ( function_exists( 'sg_cachepress_purge_cache' ) ) {
			sg_cachepress_purge_cache();
			$did = true;
		}
		if ( function_exists( 'has_action' ) && has_action( 'ce_clear_cache' ) ) {
			do_action( 'ce_clear_cache' );
			$did = true;
		}

		return $did;
	}
}
