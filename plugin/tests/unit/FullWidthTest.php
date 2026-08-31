<?php
/**
 * Full-width container rewrite tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Elementor\Full_Width;
use PHPUnit\Framework\TestCase;

final class FullWidthTest extends TestCase {

	public function test_sets_content_width_full_and_overrides_boxed(): void {
		$tree = array(
			array(
				'id'         => 'c1',
				'elType'     => 'container',
				'widgetType' => null,
				'isInner'    => false,
				'settings'   => array(
					'content_width'  => 'boxed',
					'flex_direction' => 'column',
				),
				'elements'   => array(
					array(
						'id'         => 'w1',
						'elType'     => 'widget',
						'widgetType' => 'heading',
						'isInner'    => false,
						'settings'   => array( 'title' => 'Hi' ),
						'elements'   => array(),
					),
				),
			),
		);
		$out = Full_Width::ensure_tree( $tree );
		$this->assertSame( 'full', $out[0]['settings']['content_width'] );
		$this->assertSame( 'column', $out[0]['settings']['flex_direction'] );
		$this->assertSame( 'heading', $out[0]['elements'][0]['widgetType'] );
	}
}
