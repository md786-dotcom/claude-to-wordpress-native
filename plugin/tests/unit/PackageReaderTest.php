<?php
/**
 * Package reader shape tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Import\Package_Reader;
use PHPUnit\Framework\TestCase;

final class PackageReaderTest extends TestCase {

	public function test_rejects_php_snippets(): void {
		$data = array(
			'version' => 1,
			'theme'   => array( 'slug' => 'x', 'name' => 'X' ),
			'pages'   => array( array( 'title' => 'Home' ) ),
			'snippets'=> array(
				array(
					'title' => 'Bad',
					'type'  => 'php',
					'code'  => '<?php',
				),
			),
		);
		$result = Package_Reader::validate_shape( $data );
		$this->assertTrue( is_wp_error( $result ) );
	}

	public function test_declared_plugins_omit_woo_by_default(): void {
		$data = array(
			'version'     => 1,
			'theme'       => array(),
			'pages'       => array( array() ),
			'woocommerce' => array( 'enabled' => false ),
		);
		$plugins = Package_Reader::declared_plugins( $data );
		$this->assertNotContains( 'woocommerce', $plugins );
		$this->assertContains( 'elementor', $plugins );
	}

	public function test_declared_plugins_include_woo_when_enabled(): void {
		$data = array(
			'woocommerce' => array( 'enabled' => true ),
		);
		$plugins = Package_Reader::declared_plugins( $data );
		$this->assertContains( 'woocommerce', $plugins );
	}
}
