<?php
/**
 * Sideloads package media and rewrites Elementor attachment refs.
 *
 * @package CTW_Native
 */

namespace CTW_Native\Import;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Media sideload + rewrite.
 */
final class Media_Sideloader {

	/**
	 * Map of package media id => attachment array.
	 *
	 * @var array<string,array{id:int,url:string}>
	 */
	private $map = array();

	/**
	 * @param array<string,mixed> $package Package data.
	 * @return true|\WP_Error
	 */
	public function sideload_all( array $package ) {
		$items = isset( $package['media'] ) && is_array( $package['media'] ) ? $package['media'] : array();
		$root  = trailingslashit( get_stylesheet_directory() ) . 'media/';

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$id   = isset( $item['id'] ) ? (string) $item['id'] : '';
			$path = isset( $item['path'] ) ? (string) $item['path'] : '';
			$alt  = isset( $item['alt'] ) ? (string) $item['alt'] : '';
			if ( '' === $id || '' === $path || false !== strpos( $path, '..' ) ) {
				return new \WP_Error( 'ctw_media_path', 'Invalid media path.' );
			}
			$full = $root . ltrim( $path, '/' );
			if ( ! is_readable( $full ) ) {
				return new \WP_Error( 'ctw_media_missing', 'Missing media file: ' . $path );
			}
			$attachment = $this->sideload_file( $full, $alt );
			if ( is_wp_error( $attachment ) ) {
				return $attachment;
			}
			$this->map[ $id ] = $attachment;
		}
		return true;
	}

	/**
	 * @return array<string,array{id:int,url:string}>
	 */
	public function map(): array {
		return $this->map;
	}

	/**
	 * Attachment for a package media id, or null.
	 *
	 * @param string $media_id Package media id.
	 * @return array{id:int,url:string}|null
	 */
	public function attachment_for( string $media_id ) {
		return $this->map[ $media_id ] ?? null;
	}

	/**
	 * Rewrite attachment-like settings in an element tree.
	 *
	 * @param list<array<string,mixed>> $elements Tree.
	 * @return list<array<string,mixed>>
	 */
	public function rewrite_tree( array $elements ): array {
		$out = array();
		foreach ( $elements as $element ) {
			$out[] = $this->rewrite_node( $element );
		}
		return $out;
	}

	/**
	 * @param array<string,mixed> $node Node.
	 * @return array<string,mixed>
	 */
	private function rewrite_node( array $node ): array {
		if ( isset( $node['settings'] ) && is_array( $node['settings'] ) ) {
			$node['settings'] = $this->rewrite_settings( $node['settings'] );
		}
		if ( isset( $node['elements'] ) && is_array( $node['elements'] ) ) {
			$children = array();
			foreach ( $node['elements'] as $child ) {
				if ( is_array( $child ) ) {
					$children[] = $this->rewrite_node( $child );
				}
			}
			$node['elements'] = $children;
		}
		return $node;
	}

	/**
	 * @param array<string,mixed> $settings Settings.
	 * @return array<string,mixed>
	 */
	private function rewrite_settings( array $settings ): array {
		foreach ( $settings as $key => $value ) {
			if ( ! is_array( $value ) ) {
				continue;
			}
			if ( isset( $value['id'], $value['url'] ) ) {
				$package_id = (string) $value['id'];
				if ( isset( $this->map[ $package_id ] ) ) {
					$settings[ $key ] = $this->map[ $package_id ];
				}
			}
		}
		return $settings;
	}

	/**
	 * @param string $full Absolute path.
	 * @param string $alt  Alt text.
	 * @return array{id:int,url:string}|\WP_Error
	 */
	private function sideload_file( string $full, string $alt ) {
		if ( ! function_exists( 'media_handle_sideload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		$tmp = wp_tempnam( basename( $full ) );
		if ( ! $tmp ) {
			return new \WP_Error( 'ctw_tmp', 'Could not create temp file.' );
		}
		copy( $full, $tmp );

		$file_array = array(
			'name'     => basename( $full ),
			'tmp_name' => $tmp,
		);
		$id = media_handle_sideload( $file_array, 0, $alt );
		if ( is_wp_error( $id ) ) {
			@unlink( $tmp );
			return $id;
		}
		if ( '' !== $alt ) {
			update_post_meta( (int) $id, '_wp_attachment_image_alt', sanitize_text_field( $alt ) );
		}
		$url = wp_get_attachment_url( (int) $id );
		return array(
			'id'  => (int) $id,
			'url' => is_string( $url ) ? $url : '',
		);
	}
}
