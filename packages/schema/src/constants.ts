/**
 * Free Elementor widget types allowed in ctw-package page trees.
 */
export const FREE_WIDGET_TYPES = [
  "heading",
  "image",
  "text-editor",
  "video",
  "button",
  "divider",
  "spacer",
  "google_maps",
  "icon",
  "image-box",
  "icon-box",
  "star-rating",
  "image-carousel",
  "image-gallery",
  "icon-list",
  "counter",
  "progress",
  "testimonial",
  "tabs",
  "accordion",
  "toggle",
  "social-icons",
  "alert",
  "html",
  "shortcode",
  "menu-anchor",
  "sidebar",
] as const;

export type FreeWidgetType = (typeof FREE_WIDGET_TYPES)[number];

export const FREE_WIDGET_SET: ReadonlySet<string> = new Set(FREE_WIDGET_TYPES);

export const CORE_PLUGIN_SLUGS = [
  "elementor",
  "elementskit-lite",
  "metform",
  "insert-headers-and-footers",
] as const;

export const WOO_PLUGIN_SLUG = "woocommerce" as const;

export const SNIPPET_TYPES = ["css", "js", "html"] as const;

export type SnippetType = (typeof SNIPPET_TYPES)[number];
