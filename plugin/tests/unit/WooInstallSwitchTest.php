<?php
/**
 * WooCommerce install switch tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Import\Package_Reader;
use CTW_Native\Stack\Woo_Install_Switch;
use PHPUnit\Framework\TestCase;

final class WooInstallSwitchTest extends TestCase {

	protected function setUp(): void {
		$GLOBALS['ctw_test_options'] = array();
	}

	public function test_resolve_or_logic(): void {
		$this->assertFalse( Woo_Install_Switch::resolve( false, false ) );
		$this->assertTrue( Woo_Install_Switch::resolve( true, false ) );
		$this->assertTrue( Woo_Install_Switch::resolve( false, true ) );
		$this->assertTrue( Woo_Install_Switch::resolve( true, true ) );
	}

	public function test_option_persists(): void {
		$this->assertFalse( Woo_Install_Switch::is_enabled() );
		Woo_Install_Switch::set_enabled( true );
		$this->assertTrue( Woo_Install_Switch::is_enabled() );
		Woo_Install_Switch::set_enabled( false );
		$this->assertFalse( Woo_Install_Switch::is_enabled() );
	}

	public function test_should_install_from_package_or_switch(): void {
		$brochure = array( 'woocommerce' => array( 'enabled' => false ) );
		$shop     = array( 'woocommerce' => array( 'enabled' => true ) );

		$this->assertFalse( Woo_Install_Switch::should_install( $brochure ) );
		$this->assertTrue( Woo_Install_Switch::should_install( $shop ) );

		Woo_Install_Switch::set_enabled( true );
		$this->assertTrue( Woo_Install_Switch::should_install( $brochure ) );
		$this->assertTrue( Woo_Install_Switch::should_install( null ) );
	}

	public function test_install_plugins_includes_woo_when_switch_on(): void {
		$brochure = array(
			'version'     => 1,
			'theme'       => array(),
			'pages'       => array( array() ),
			'woocommerce' => array( 'enabled' => false ),
		);
		$without = Package_Reader::install_plugins( $brochure, false );
		$this->assertNotContains( 'woocommerce', $without );

		$with = Package_Reader::install_plugins( $brochure, true );
		$this->assertContains( 'woocommerce', $with );

		$forced = Package_Reader::install_plugins(
			array( 'woocommerce' => array( 'enabled' => true ) ),
			false
		);
		$this->assertContains( 'woocommerce', $forced );
	}
}
