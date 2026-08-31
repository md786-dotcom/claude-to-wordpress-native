# Domain glossary

## Package contract

The single shared definition of what a legal `ctw-package.json` may contain for Free Elementor widgets, core plugins, WooCommerce gate, WPCode snippet types, and wordpress.org plugin main files. Source of truth: `packages/schema/contract/ctw-contract.json`. Synced into TypeScript constants and `CTW_Native\Contract\Package_Contract`.

## Media asset

A file under `./media/` registered in `media[]` with a package-local `id` and relative `path`. Optional `sourceUrl` (https only) is provenance plus a download hint for `media fetch` / `media sync` / `generate`. Elementor Free image controls reference `{ "id": "<media.id>", "url": "" }` until the plugin rewrites them to WordPress attachments.

## Child theme artifact

The Hello Elementor child theme ZIP emitted by `@ctw/generate` (`generateChildThemeZip`): theme kit, optional Woo templates, media, `style.css` with `Template: hello-elementor`, and embedded `ctw-package.json`.

## One-shot package apply

The plugin import path that reads the active child theme package once, sideloads media, writes Elementor Free pages, ElementsKit header/footer, MetForm, WPCode, and menus, then marks import done. Re-import requires wipe. Wipe keeps Customizer Additional CSS.

## Elementor persistence

Writing `_elementor_*` meta so **Edit with Elementor** works. Pages and ElementsKit templates both go through `Document_Writer` after Free tree validation. Containers are forced to Elementor `content_width: full` (never boxed).

## Stack install

Installing Hello Elementor (parent) and declared free plugins from wordpress.org via the setup UI. WooCommerce is included when the package sets `woocommerce.enabled`, or when the Setup **Install WooCommerce** switch is on (`ctw_native_install_woocommerce`). Shop packages may declare branded shop/cart/checkout Elementor pages, up to four dummy products, and WPCode snippets including `php`.

## Cache purge

`CTW_Native\Cache\Cache_Purger` hooks `after_switch_theme` (any theme) and also runs after a successful package import. It flushes object cache, theme cache, rewrite rules, Elementor file CSS when present, and common page-cache plugins so the newly activated theme is what visitors see.
