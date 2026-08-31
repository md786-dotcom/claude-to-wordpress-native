<?php
/**
 * CTW Theme Kit — Hello Elementor child starter.
 *
 * @package CTW_Theme_Kit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CTW_THEME_KIT_VERSION', '1.0.0' );

/**
 * Enqueue child styles after Hello Elementor theme style.
 *
 * Do not dequeue wp-custom-css.
 * Do not remove wp_custom_css_cb from wp_head.
 */
function ctw_theme_kit_scripts_styles(): void {
	wp_enqueue_style(
		'hello-elementor-child-style',
		get_stylesheet_uri(),
		array( 'hello-elementor-theme-style' ),
		CTW_THEME_KIT_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'ctw_theme_kit_scripts_styles', 20 );
