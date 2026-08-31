<?php
/**
 * WooCommerce single product template fallback for CTW child themes.
 *
 * @package CTW_Theme_Kit
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );
?>
<main id="ctw-shop-single" class="ctw-woo-single">
	<?php while ( have_posts() ) : ?>
		<?php the_post(); ?>
		<?php wc_get_template_part( 'content', 'single-product' ); ?>
	<?php endwhile; ?>
</main>
<?php
get_footer( 'shop' );
