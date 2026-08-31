<?php
/**
 * Forces Elementor Free containers to full width (not boxed).
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Elementor defaults content_width to boxed; CTW themes use full.
 */
final class Full_Width {

	/**
	 * @param list<array<string,mixed>> $elements Tree.
	 * @return list<array<string,mixed>>
	 */
	public static function ensure_tree( array $elements ): array {
		$out = array();
		foreach ( $elements as $element ) {
			if ( is_array( $element ) ) {
				$out[] = self::ensure_node( $element );
			}
		}
		return $out;
	}

	/**
	 * @param array<string,mixed> $node Node.
	 * @return array<string,mixed>
	 */
	private static function ensure_node( array $node ): array {
		if ( isset( $node['elements'] ) && is_array( $node['elements'] ) ) {
			$children = array();
			foreach ( $node['elements'] as $child ) {
				if ( is_array( $child ) ) {
					$children[] = self::ensure_node( $child );
				}
			}
			$node['elements'] = $children;
		}

		$el_type = isset( $node['elType'] ) ? (string) $node['elType'] : '';
		if ( 'container' === $el_type ) {
			if ( ! isset( $node['settings'] ) || ! is_array( $node['settings'] ) ) {
				$node['settings'] = array();
			}
			$node['settings']['content_width'] = 'full';
		}
		return $node;
	}
}
