# Domain glossary

## Package contract

The single shared definition of what a legal `ctw-package.json` may contain for Free Elementor widgets, core plugins, WooCommerce gate, WPCode snippet types, and wordpress.org plugin main files. Source of truth: `packages/schema/contract/ctw-contract.json`. Synced into TypeScript constants and `CTW_Native\Contract\Package_Contract`.

## Child theme artifact

The Hello Elementor child theme ZIP emitted by `@ctw/generate` (`generateChildThemeZip`): theme kit, optional Woo templates, media, `style.css` with `Template: hello-elementor`, and embedded `ctw-package.json`.

## One-shot package apply

The plugin import path that reads the active child theme package once, sideloads media, writes Elementor Free pages, ElementsKit header/footer, MetForm, WPCode, and menus, then marks import done. Re-import requires wipe. Wipe keeps Customizer Additional CSS.

## Elementor persistence

Writing `_elementor_*` meta so **Edit with Elementor** works. Pages and ElementsKit templates both go through `Document_Writer` after Free tree validation.

## Stack install

Installing Hello Elementor (parent) and declared free plugins from wordpress.org via the setup UI. WooCommerce is included only when the package enables it.
