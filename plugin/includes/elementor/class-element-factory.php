<?php
/**
 * Builds Elementor element arrays (Free only).
 *
 * Adapted from EMCP Tools Element Factory patterns (GPL-2.0-or-later).
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Element factory.
 */
final class Element_Factory {

	/**
	 * @return string
	 */
	public static function generate_id(): string {
		return substr( bin2hex( random_bytes( 4 ) ), 0, 7 );
	}

	/**
	 * @param array<string,mixed> $settings Settings.
	 * @param list<array<string,mixed>> $children Children.
	 * @return array<string,mixed>
	 */
	public static function container( array $settings = array(), array $children = array() ): array {
		$defaults = array(
			'container_type' => 'flex',
			'content_width'  => 'boxed',
		);
		return array(
			'id'         => self::generate_id(),
			'elType'     => 'container',
			'widgetType' => null,
			'isInner'    => false,
			'settings'   => array_merge( $defaults, $settings ),
			'elements'   => $children,
		);
	}

	/**
	 * @param string              $widget_type Free widget type.
	 * @param array<string,mixed> $settings    Settings.
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function widget( string $widget_type, array $settings = array() ) {
		if ( ! Widget_Allowlist::is_allowed( $widget_type ) ) {
			return new \WP_Error(
				'ctw_pro_widget',
				sprintf( 'Widget type not allowed: %s', $widget_type )
			);
		}
		return array(
			'id'         => self::generate_id(),
			'elType'     => 'widget',
			'widgetType' => $widget_type,
			'isInner'    => false,
			'settings'   => $settings,
			'elements'   => array(),
		);
	}
}
