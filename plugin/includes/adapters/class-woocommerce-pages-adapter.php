<?php
/**
 * Brands WooCommerce system pages (shop, cart, checkout) via Elementor Free trees.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

use CTW_Native\Elementor\Document_Writer;
use CTW_Native\Import\Media_Sideloader;
use CTW_Native\Import\Package_Reader;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Writes Elementor pages and assigns WooCommerce page options.
 */
final class WooCommerce_Pages_Adapter {

	/**
	 * Map of package page keys to WooCommerce option names.
	 *
	 * @var array<string,string>
	 */
	private const OPTION_MAP = array(
		'shop'     => 'woocommerce_shop_page_id',
		'cart'     => 'woocommerce_cart_page_id',
		'checkout' => 'woocommerce_checkout_page_id',
	);

	/**
	 * Default shortcodes when Claude omits a branded page tree.
	 *
	 * @var array<string,string>
	 */
	private const DEFAULT_SHORTCODES = array(
		'shop'     => '[products limit="4" columns="2"]',
		'cart'     => '[woocommerce_cart]',
		'checkout' => '[woocommerce_checkout]',
	);

	/**
	 * @param array<string,mixed> $package Package.
	 * @param Media_Sideloader    $media   Rewriter.
	 * @return array{pages:list<int>}|\WP_Error
	 */
	public static function import_pages( array $package, Media_Sideloader $media ) {
		if ( ! Package_Reader::woo_enabled( $package ) ) {
			return array( 'pages' => array() );
		}
		if ( ! class_exists( '\WooCommerce' ) ) {
			return new \WP_Error( 'ctw_woo_missing', 'WooCommerce must be active before importing shop pages.' );
		}

		$woo   = isset( $package['woocommerce'] ) && is_array( $package['woocommerce'] ) ? $package['woocommerce'] : array();
		$pages = isset( $woo['pages'] ) && is_array( $woo['pages'] ) ? $woo['pages'] : array();
		$ids   = array();

		foreach ( self::OPTION_MAP as $key => $option ) {
			$page_spec = isset( $pages[ $key ] ) && is_array( $pages[ $key ] ) ? $pages[ $key ] : null;
			$title     = is_array( $page_spec ) && ! empty( $page_spec['title'] )
				? (string) $page_spec['title']
				: ucfirst( $key );
			$slug      = 'ctw-' . $key;
			$elements  = is_array( $page_spec ) && isset( $page_spec['elements'] ) && is_array( $page_spec['elements'] )
				? $page_spec['elements']
				: self::default_elements( $key, $title );

			$elements = $media->rewrite_tree( $elements );
			$post_id  = Document_Writer::write_page( $title, $slug, $elements );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			update_option( $option, (int) $post_id );
			$ids[] = (int) $post_id;
		}

		return array( 'pages' => $ids );
	}

	/**
	 * Minimal Free Elementor tree: heading + shortcode.
	 *
	 * @param string $key   shop|cart|checkout.
	 * @param string $title Page title.
	 * @return list<array<string,mixed>>
	 */
	private static function default_elements( string $key, string $title ): array {
		$shortcode = self::DEFAULT_SHORTCODES[ $key ] ?? '';
		return array(
			array(
				'id'         => substr( md5( 'ctw-woo-' . $key ), 0, 7 ),
				'elType'     => 'container',
				'widgetType' => null,
				'isInner'    => false,
				'settings'   => array(
					'content_width'  => 'full',
					'flex_direction' => 'column',
					'gap'            => array(
						'unit' => 'px',
						'size' => 24,
					),
				),
				'elements'   => array(
					array(
						'id'         => substr( md5( 'ctw-woo-h-' . $key ), 0, 7 ),
						'elType'     => 'widget',
						'widgetType' => 'heading',
						'isInner'    => false,
						'settings'   => array(
							'title'       => $title,
							'header_size' => 'h1',
						),
						'elements'   => array(),
					),
					array(
						'id'         => substr( md5( 'ctw-woo-s-' . $key ), 0, 7 ),
						'elType'     => 'widget',
						'widgetType' => 'shortcode',
						'isInner'    => false,
						'settings'   => array(
							'shortcode' => $shortcode,
						),
						'elements'   => array(),
					),
				),
			),
		);
	}
}
