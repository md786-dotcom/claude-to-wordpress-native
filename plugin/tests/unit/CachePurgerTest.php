<?php
/**
 * Cache purge and theme-switch visibility tests.
 *
 * @package CTW_Native
 */

use CTW_Native\Cache\Cache_Purger;
use PHPUnit\Framework\TestCase;

final class CachePurgerTest extends TestCase {

	protected function setUp(): void {
		$GLOBALS['ctw_test_options']      = array();
		$GLOBALS['ctw_test_object_cache'] = array();
		$GLOBALS['ctw_test_actions']      = array();
		$GLOBALS['ctw_test_flushed']      = array(
			'object_cache'  => 0,
			'theme_cache'   => 0,
			'rewrite_rules' => 0,
			'page_cache'    => 0,
			'elementor'     => 0,
		);
	}

	/**
	 * Activate a theme while leaving a stale object-cache hit for stylesheet.
	 *
	 * @param string $stylesheet New theme stylesheet slug.
	 */
	private function switch_theme_with_stale_cache( string $stylesheet ): void {
		$previous = (string) ( $GLOBALS['ctw_test_options']['stylesheet'] ?? 'old-theme' );
		$GLOBALS['ctw_test_options']['stylesheet']             = $stylesheet;
		$GLOBALS['ctw_test_object_cache']['option:stylesheet'] = $previous;
	}

	public function test_register_hooks_after_switch_theme(): void {
		Cache_Purger::register();
		$this->assertArrayHasKey( 'after_switch_theme', $GLOBALS['ctw_test_actions'] );
		$this->assertNotEmpty( $GLOBALS['ctw_test_actions']['after_switch_theme'] );
	}

	public function test_stale_cache_keeps_old_theme_until_purge(): void {
		update_option( 'stylesheet', 'first-theme' );
		$this->switch_theme_with_stale_cache( 'second-theme' );

		$this->assertSame( 'first-theme', get_stylesheet(), 'Object cache still serves the first theme' );

		$result = Cache_Purger::purge( 'theme_switch', 'second-theme' );
		$this->assertContains( 'object_cache', $result['cleared'] );
		$this->assertSame( 'second-theme', get_stylesheet() );
		$this->assertSame( 'second-theme', Cache_Purger::displayed_stylesheet() );
	}

	public function test_after_switch_theme_shows_any_new_theme(): void {
		Cache_Purger::register();

		$cases = array(
			'acme-child',
			'twentytwentyfour',
			'hello-elementor',
			'shop-child',
		);

		update_option( 'stylesheet', 'initial-theme' );

		foreach ( $cases as $stylesheet ) {
			$this->switch_theme_with_stale_cache( $stylesheet );
			$this->assertNotSame(
				$stylesheet,
				get_stylesheet(),
				'Before purge, cache must still expose the previous theme'
			);

			// Same hook WordPress runs after Appearance → Themes → Activate.
			do_action( 'after_switch_theme', $stylesheet, null );

			$this->assertSame(
				$stylesheet,
				Cache_Purger::displayed_stylesheet(),
				'After switch, visitors must see ' . $stylesheet
			);
			$this->assertSame( $stylesheet, get_stylesheet() );
		}

		$this->assertGreaterThan( 0, $GLOBALS['ctw_test_flushed']['object_cache'] );
		$this->assertGreaterThan( 0, $GLOBALS['ctw_test_flushed']['theme_cache'] );
		$this->assertGreaterThan( 0, $GLOBALS['ctw_test_flushed']['rewrite_rules'] );
		$this->assertGreaterThan( 0, $GLOBALS['ctw_test_flushed']['page_cache'] );
	}

	public function test_purge_reports_layers_and_reason(): void {
		$result = Cache_Purger::purge( 'import', 'acme-child' );
		$this->assertSame( 'import', $result['reason'] );
		$this->assertSame( 'acme-child', $result['stylesheet'] );
		$this->assertContains( 'object_cache', $result['cleared'] );
		$this->assertContains( 'theme_cache', $result['cleared'] );
		$this->assertContains( 'rewrite_rules', $result['cleared'] );
		$this->assertContains( 'page_cache', $result['cleared'] );
	}

	public function test_on_theme_switched_uses_theme_switch_reason(): void {
		update_option( 'stylesheet', 'twentytwentyfive' );
		$result = Cache_Purger::on_theme_switched( 'twentytwentyfive' );
		$this->assertSame( 'theme_switch', $result['reason'] );
		$this->assertSame( 'twentytwentyfive', $result['stylesheet'] );
		$this->assertSame( 'twentytwentyfive', Cache_Purger::displayed_stylesheet() );
	}
}
