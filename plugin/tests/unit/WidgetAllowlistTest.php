<?php
/**
 * Widget allowlist tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Elementor\Widget_Allowlist;
use CTW_Native\Elementor\Tree_Validator;
use CTW_Native\Elementor\Element_Factory;
use PHPUnit\Framework\TestCase;

final class WidgetAllowlistTest extends TestCase {

	public function test_heading_is_allowed(): void {
		$this->assertTrue( Widget_Allowlist::is_allowed( 'heading' ) );
	}

	public function test_form_is_rejected(): void {
		$this->assertFalse( Widget_Allowlist::is_allowed( 'form' ) );
	}

	public function test_tree_rejects_pro_widget(): void {
		$tree = array(
			array(
				'elType'     => 'widget',
				'widgetType' => 'form',
				'settings'   => array(),
				'elements'   => array(),
			),
		);
		$result = Tree_Validator::validate( $tree );
		$this->assertTrue( is_wp_error( $result ) );
	}

	public function test_tree_accepts_free_widget(): void {
		$tree = array(
			array(
				'elType'     => 'container',
				'widgetType' => null,
				'settings'   => array(),
				'elements'   => array(
					array(
						'elType'     => 'widget',
						'widgetType' => 'heading',
						'settings'   => array( 'title' => 'Hi' ),
						'elements'   => array(),
					),
				),
			),
		);
		$this->assertTrue( Tree_Validator::validate( $tree ) );
	}

	public function test_factory_rejects_pro_widget(): void {
		$result = Element_Factory::widget( 'form', array() );
		$this->assertTrue( is_wp_error( $result ) );
	}

	public function test_factory_builds_heading(): void {
		$result = Element_Factory::widget( 'heading', array( 'title' => 'X' ) );
		$this->assertIsArray( $result );
		$this->assertSame( 'heading', $result['widgetType'] );
	}
}
