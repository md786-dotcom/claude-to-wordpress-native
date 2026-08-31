<?php
/**
 * Validates Elementor trees from a CTW package (aligned with Zod packageSchema).
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tree validator — Free widgets only; widgets have no children; containers have null widgetType.
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
			if ( ! is_array( $element ) ) {
				return new \WP_Error( 'ctw_bad_node', 'Element must be array at ' . (string) $index );
			}
			$result = self::validate_node( $element, (string) $index );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return true;
	}

	/**
	 * @param array<string,mixed> $node Node.
	 * @param string              $path Path for errors.
	 * @return true|\WP_Error
	 */
	private static function validate_node( array $node, string $path ) {
		$el_type = isset( $node['elType'] ) ? (string) $node['elType'] : '';
		if ( 'container' !== $el_type && 'widget' !== $el_type ) {
			return new \WP_Error( 'ctw_bad_eltype', 'Invalid elType at ' . $path );
		}

		$children = isset( $node['elements'] ) && is_array( $node['elements'] ) ? $node['elements'] : array();

		if ( 'widget' === $el_type ) {
			$type = isset( $node['widgetType'] ) ? (string) $node['widgetType'] : '';
			if ( '' === $type || ! Widget_Allowlist::is_allowed( $type ) ) {
				return new \WP_Error( 'ctw_pro_widget', 'Widget not allowed at ' . $path . ': ' . $type );
			}
			if ( count( $children ) > 0 ) {
				return new \WP_Error( 'ctw_widget_children', 'Widgets must not contain child elements at ' . $path );
			}
		}

		if ( 'container' === $el_type ) {
			if ( array_key_exists( 'widgetType', $node ) && null !== $node['widgetType'] ) {
				return new \WP_Error( 'ctw_container_widget', 'Containers must set widgetType to null at ' . $path );
			}
		}

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
