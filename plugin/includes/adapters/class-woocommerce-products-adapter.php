<?php
/**
 * Imports dummy WooCommerce products from the package.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Adapters;

use CTW_Native\Import\Media_Sideloader;
use CTW_Native\Import\Package_Reader;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Creates up to four simple products (name, price, description, image).
 */
final class WooCommerce_Products_Adapter {

	/**
	 * @param array<string,mixed> $package Package.
	 * @param Media_Sideloader    $media   Sideloader with attachment map.
	 * @return list<int>|\WP_Error Product post IDs.
	 */
	public static function import_products( array $package, Media_Sideloader $media ) {
		if ( ! Package_Reader::woo_enabled( $package ) ) {
			return array();
		}
		if ( ! class_exists( '\WooCommerce' ) ) {
			return new \WP_Error( 'ctw_woo_missing', 'WooCommerce must be active before importing products.' );
		}

		$woo      = isset( $package['woocommerce'] ) && is_array( $package['woocommerce'] ) ? $package['woocommerce'] : array();
		$products = isset( $woo['products'] ) && is_array( $woo['products'] ) ? $woo['products'] : array();
		if ( count( $products ) > 4 ) {
			return new \WP_Error( 'ctw_woo_products_cap', 'Dummy products are capped at 4.' );
		}

		$ids = array();
		foreach ( $products as $product ) {
			if ( ! is_array( $product ) ) {
				continue;
			}
			$id = self::create_product( $product, $media );
			if ( is_wp_error( $id ) ) {
				return $id;
			}
			$ids[] = (int) $id;
		}
		return $ids;
	}

	/**
	 * @param array<string,mixed> $product Product row.
	 * @param Media_Sideloader    $media   Media map.
	 * @return int|\WP_Error
	 */
	private static function create_product( array $product, Media_Sideloader $media ) {
		$name        = isset( $product['name'] ) ? sanitize_text_field( (string) $product['name'] ) : '';
		$price       = isset( $product['price'] ) ? (string) $product['price'] : '';
		$description = isset( $product['description'] ) ? wp_kses_post( (string) $product['description'] ) : '';
		$media_id    = isset( $product['imageMediaId'] ) ? (string) $product['imageMediaId'] : '';

		if ( '' === $name || '' === $price ) {
			return new \WP_Error( 'ctw_woo_product', 'Product name and price are required.' );
		}

		$post_id = wp_insert_post(
			array(
				'post_title'   => $name,
				'post_content' => $description,
				'post_status'  => 'publish',
				'post_type'    => 'product',
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		wp_set_object_terms( (int) $post_id, 'simple', 'product_type' );
		update_post_meta( (int) $post_id, '_regular_price', wc_format_decimal( $price ) );
		update_post_meta( (int) $post_id, '_price', wc_format_decimal( $price ) );
		update_post_meta( (int) $post_id, '_manage_stock', 'no' );
		update_post_meta( (int) $post_id, '_stock_status', 'instock' );
		update_post_meta( (int) $post_id, '_visibility', 'visible' );
		update_post_meta( (int) $post_id, '_ctw_dummy_product', '1' );

		if ( '' !== $media_id ) {
			$attachment = $media->attachment_for( $media_id );
			if ( is_array( $attachment ) && ! empty( $attachment['id'] ) ) {
				set_post_thumbnail( (int) $post_id, (int) $attachment['id'] );
			}
		}

		if ( function_exists( 'wc_delete_product_transients' ) ) {
			wc_delete_product_transients( (int) $post_id );
		}

		return (int) $post_id;
	}
}
