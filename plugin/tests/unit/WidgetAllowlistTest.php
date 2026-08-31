<?php
/**
 * Widget allowlist and tree validator tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Contract\Package_Contract;
use CTW_Native\Elementor\Widget_Allowlist;
use CTW_Native\Elementor\Tree_Validator;
use PHPUnit\Framework\TestCase;

final class WidgetAllowlistTest extends TestCase {

	public function test_heading_is_allowed(): void {
		$this->assertTrue( Widget_Allowlist::is_allowed( 'heading' ) );
	}

	public function test_form_is_rejected(): void {
		$this->assertFalse( Widget_Allowlist::is_allowed( 'form' ) );
	}

	public function test_contract_matches_allowlist(): void {
		$this->assertSame( Package_Contract::free_widgets(), Widget_Allowlist::all() );
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

	public function test_tree_rejects_widget_children(): void {
		$tree = array(
			array(
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(),
				'elements'   => array(
					array(
						'elType'     => 'widget',
						'widgetType' => 'button',
						'settings'   => array(),
						'elements'   => array(),
					),
				),
			),
		);
		$result = Tree_Validator::validate( $tree );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'ctw_widget_children', $result->get_error_code() );
	}

	public function test_tree_rejects_container_with_widget_type(): void {
		$tree = array(
			array(
				'elType'     => 'container',
				'widgetType' => 'heading',
				'settings'   => array(),
				'elements'   => array(),
			),
		);
		$result = Tree_Validator::validate( $tree );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'ctw_container_widget', $result->get_error_code() );
	}
}
