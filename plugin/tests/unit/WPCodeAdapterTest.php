<?php
/**
 * WPCode Free adapter tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Adapters\WPCode_Adapter;
use PHPUnit\Framework\TestCase;

require_once dirname( __DIR__, 2 ) . '/includes/adapters/class-wpcode-adapter.php';

final class WPCodeAdapterTest extends TestCase {

	protected function setUp(): void {
		$GLOBALS['ctw_test_posts']                 = array();
		$GLOBALS['ctw_test_post_meta']             = array();
		$GLOBALS['ctw_test_post_terms']            = array();
		$GLOBALS['ctw_test_post_types']            = array( 'wpcode' => true );
		$GLOBALS['ctw_test_next_post_id']          = 1;
		$GLOBALS['ctw_test_wpcode_cache_rebuilds'] = 0;
	}

	public function test_maps_css_header_and_everywhere_to_site_wide_header(): void {
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'css', 'header' ) );
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'css', 'everywhere' ) );
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'css', '' ) );
		$this->assertSame( 'site_wide_footer', WPCode_Adapter::map_free_location( 'css', 'footer' ) );
	}

	public function test_maps_js_and_html_like_css(): void {
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'js', 'header' ) );
		$this->assertSame( 'site_wide_footer', WPCode_Adapter::map_free_location( 'html', 'footer' ) );
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'html', 'everywhere' ) );
	}

	public function test_maps_php_everywhere_to_everywhere(): void {
		$this->assertSame( 'everywhere', WPCode_Adapter::map_free_location( 'php', 'everywhere' ) );
		$this->assertSame( 'everywhere', WPCode_Adapter::map_free_location( 'php', '' ) );
		$this->assertSame( 'site_wide_header', WPCode_Adapter::map_free_location( 'php', 'header' ) );
		$this->assertSame( 'site_wide_footer', WPCode_Adapter::map_free_location( 'php', 'footer' ) );
	}

	public function test_import_writes_wpcode_free_taxonomies_and_auto_insert(): void {
		$result = WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Layout',
					'type'     => 'css',
					'location' => 'header',
					'code'     => '.grid-2,.grid-2 .e-con-inner{display:grid;}',
				),
			)
		);
		$this->assertSame( array( 1 ), $result );
		$this->assertSame( 'publish', $GLOBALS['ctw_test_posts'][1]['post_status'] );
		$this->assertSame( 'wpcode', $GLOBALS['ctw_test_posts'][1]['post_type'] );
		$this->assertSame( array( 'css' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::TYPE_TAXONOMY ] );
		$this->assertSame( array( 'site_wide_header' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::LOCATION_TAXONOMY ] );
		$this->assertSame( 1, $GLOBALS['ctw_test_post_meta'][1][ WPCode_Adapter::AUTO_INSERT_META ] );
		$this->assertSame( 'css', $GLOBALS['ctw_test_post_meta'][1]['_ctw_snippet_type'] );
	}

	public function test_import_maps_legacy_css_everywhere_to_header_hook(): void {
		WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Legacy',
					'type'     => 'css',
					'location' => 'everywhere',
					'code'     => 'body{margin:0;}',
				),
			)
		);
		$this->assertSame( array( 'site_wide_header' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::LOCATION_TAXONOMY ] );
	}

	public function test_import_php_everywhere_uses_php_location(): void {
		WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Helper',
					'type'     => 'php',
					'location' => 'everywhere',
					'code'     => '<?php // ok',
				),
			)
		);
		$this->assertSame( array( 'php' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::TYPE_TAXONOMY ] );
		$this->assertSame( array( 'everywhere' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::LOCATION_TAXONOMY ] );
	}

	public function test_import_does_not_write_pro_or_unused_meta(): void {
		WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Layout',
					'type'     => 'css',
					'location' => 'header',
					'code'     => 'body{}',
				),
			)
		);
		$meta = $GLOBALS['ctw_test_post_meta'][1];
		$this->assertArrayNotHasKey( '_wpcode_device_type', $meta );
		$this->assertArrayNotHasKey( '_wpcode_conditional_logic', $meta );
		$this->assertArrayNotHasKey( '_wpcode_conditional_logic_enabled', $meta );
		$this->assertArrayNotHasKey( '_wpcode_location_extra', $meta );
		$this->assertArrayNotHasKey( '_wpcode_code_type', $meta );
		$this->assertArrayNotHasKey( 'wpcode_code_type', $meta );
		$this->assertArrayNotHasKey( '_wpcode_auto_insert_location', $meta );
		$this->assertArrayNotHasKey( 'wpcode_auto_insert', $meta );
	}

	public function test_import_rebuilds_wpcode_free_cache(): void {
		WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Layout',
					'type'     => 'css',
					'location' => 'header',
					'code'     => 'body{}',
				),
			)
		);
		$this->assertSame( 1, $GLOBALS['ctw_test_wpcode_cache_rebuilds'] );
	}

	public function test_empty_snippets_skip_cache_rebuild(): void {
		$result = WPCode_Adapter::import_snippets( array() );
		$this->assertSame( array(), $result );
		$this->assertSame( 0, $GLOBALS['ctw_test_wpcode_cache_rebuilds'] );
	}

	public function test_rejects_pro_snippet_types(): void {
		$result = WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Pro SCSS',
					'type'     => 'scss',
					'location' => 'header',
					'code'     => '$c: #f00;',
				),
			)
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'ctw_bad_snippet', $result->get_error_code() );
	}

	public function test_fallback_cpt_when_wpcode_missing(): void {
		$GLOBALS['ctw_test_post_types'] = array();
		$result                         = WPCode_Adapter::import_snippets(
			array(
				array(
					'title'    => 'Layout',
					'type'     => 'css',
					'location' => 'footer',
					'code'     => 'body{}',
				),
			)
		);
		$this->assertSame( array( 1 ), $result );
		$this->assertSame( 'ctw_snippet', $GLOBALS['ctw_test_posts'][1]['post_type'] );
		$this->assertSame( array( 'site_wide_footer' ), $GLOBALS['ctw_test_post_terms'][1][ WPCode_Adapter::LOCATION_TAXONOMY ] );
		$this->assertArrayHasKey( 'ctw_snippet', $GLOBALS['ctw_test_post_types'] );
	}
}
