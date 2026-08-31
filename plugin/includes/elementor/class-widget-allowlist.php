<?php
/**
 * Free Elementor widget allowlist.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rejects Pro / unknown widgets.
 */
final class Widget_Allowlist {

	/**
	 * Allowed free widget types.
	 *
	 * @var list<string>
	 */
	private const ALLOWED = array(
		'heading',
		'image',
		'text-editor',
		'video',
		'button',
		'divider',
		'spacer',
		'google_maps',
		'icon',
		'image-box',
		'icon-box',
		'star-rating',
		'image-carousel',
		'image-gallery',
		'icon-list',
		'counter',
		'progress',
		'testimonial',
		'tabs',
		'accordion',
		'toggle',
		'social-icons',
		'alert',
		'html',
		'shortcode',
		'menu-anchor',
		'sidebar',
	);

	/**
	 * @return list<string>
	 */
	public static function all(): array {
		return self::ALLOWED;
	}

	/**
	 * @param string $widget_type Widget type slug.
	 */
	public static function is_allowed( string $widget_type ): bool {
		return in_array( $widget_type, self::ALLOWED, true );
	}
}
