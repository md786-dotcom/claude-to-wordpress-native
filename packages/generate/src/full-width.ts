import type { CtwElementNode, CtwPackage, JsonValue } from "@ctw/schema";

/**
 * Elementor Free defaults container content_width to "boxed".
 * Force "full" so Claude-generated themes stretch edge-to-edge.
 */
export function ensureContainerFullWidth(
  settings: { [key: string]: JsonValue },
): { [key: string]: JsonValue } {
  return {
    ...settings,
    content_width: "full",
  };
}

/**
 * Walk an Elementor tree and set content_width full on every container.
 */
export function ensureTreeFullWidth(elements: CtwElementNode[]): CtwElementNode[] {
  return elements.map((node) => ensureNodeFullWidth(node));
}

function ensureNodeFullWidth(node: CtwElementNode): CtwElementNode {
  const next: CtwElementNode = {
    ...node,
    elements: node.elements.map((child) => ensureNodeFullWidth(child)),
  };
  if (node.elType === "container") {
    next.settings = ensureContainerFullWidth(node.settings);
  }
  return next;
}

/**
 * Apply full-width container settings across pages, header, footer, and woo pages.
 */
export function ensurePackageFullWidth(pkg: CtwPackage): CtwPackage {
  const pages = pkg.pages.map((page) => ({
    ...page,
    elements: ensureTreeFullWidth(page.elements),
  }));

  const header =
    pkg.header === undefined
      ? undefined
      : { ...pkg.header, elements: ensureTreeFullWidth(pkg.header.elements) };
  const footer =
    pkg.footer === undefined
      ? undefined
      : { ...pkg.footer, elements: ensureTreeFullWidth(pkg.footer.elements) };

  const wooPages = pkg.woocommerce.pages;
  const nextWooPages = {
    ...wooPages,
    ...(wooPages.shop !== undefined
      ? {
          shop: {
            ...wooPages.shop,
            elements: ensureTreeFullWidth(wooPages.shop.elements),
          },
        }
      : {}),
    ...(wooPages.cart !== undefined
      ? {
          cart: {
            ...wooPages.cart,
            elements: ensureTreeFullWidth(wooPages.cart.elements),
          },
        }
      : {}),
    ...(wooPages.checkout !== undefined
      ? {
          checkout: {
            ...wooPages.checkout,
            elements: ensureTreeFullWidth(wooPages.checkout.elements),
          },
        }
      : {}),
  };

  return {
    ...pkg,
    pages,
    ...(header !== undefined ? { header } : {}),
    ...(footer !== undefined ? { footer } : {}),
    woocommerce: {
      ...pkg.woocommerce,
      pages: nextWooPages,
    },
  };
}
