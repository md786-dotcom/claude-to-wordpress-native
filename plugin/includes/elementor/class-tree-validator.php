<?php
/**
 * Validates and normalizes Elementor trees from a CTW package.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tree validator.
 */
final class Tree_Validator {

	/**
	 * Validate a list of element nodes.
	 *
	 * @param list<array<string,mixed>> $elements Elements.
	 * @return true|\WP_Error
	 */
	public static function validate( array $elements ) {
		foreach ( $elements as $index => $element ) {
			$result = self::validate_node( $element, (string) $index );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return true;
	}

	/**
	 * @param array<string,mixed> $node  Node.
	 * @param string              $path  Path for errors.
	 * @return true|\WP_Error
	 */
	private static function validate_node( array $node, string $path ) {
		$el_type = isset( $node['elType'] ) ? (string) $node['elType'] : '';
		if ( 'container' !== $el_type && 'widget' !== $el_type ) {
			return new \WP_Error( 'ctw_bad_eltype', 'Invalid elType at ' . $path );
		}
		if ( 'widget' === $el_type ) {
			$type = isset( $node['widgetType'] ) ? (string) $node['widgetType'] : '';
			if ( ! Widget_Allowlist::is_allowed( $type ) ) {
				return new \WP_Error( 'ctw_pro_widget', 'Widget not allowed at ' . $path . ': ' . $type );
			}
		}
		$children = isset( $node['elements'] ) && is_array( $node['elements'] ) ? $node['elements'] : array();
		foreach ( $children as $i => $child ) {
			if ( ! is_array( $child ) ) {
				return new \WP_Error( 'ctw_bad_child', 'Child must be array at ' . $path );
			}
			$result = self::validate_node( $child, $path . '.' . $i );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return true;
	}
}
