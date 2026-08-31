import { z } from "zod";
import {
  CORE_PLUGIN_SLUGS,
  FREE_WIDGET_SET,
  SNIPPET_TYPES,
  WOO_PLUGIN_SLUG,
} from "./constants.js";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "color must be #RGB or #RRGGBB");

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

const relativePath = z
  .string()
  .min(1)
  .refine((value) => !value.includes("..") && !value.startsWith("/"), {
    message: "path must be relative and must not contain ..",
  });

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const themeSchema = z.object({
  slug,
  name: z.string().min(1).max(120),
  colors: z
    .object({
      primary: hexColor.optional(),
      secondary: hexColor.optional(),
      text: hexColor.optional(),
      background: hexColor.optional(),
    })
    .default({}),
  typography: z
    .object({
      headingFont: z.string().min(1).max(80).optional(),
      bodyFont: z.string().min(1).max(80).optional(),
    })
    .default({}),
  menus: z
    .array(
      z.object({
        location: z.enum(["menu-1", "menu-2"]),
        name: z.string().min(1).max(80),
        items: z.array(
          z.object({
            title: z.string().min(1).max(120),
            pageSlug: slug,
          }),
        ),
      }),
    )
    .default([]),
});

export const mediaItemSchema = z.object({
  id: z.string().min(1).max(64),
  path: relativePath,
  alt: z.string().max(200).default(""),
  sourceUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), {
      message: "sourceUrl must be an https URL",
    })
    .optional(),
});

export type ElementNode = {
  id: string;
  elType: "container" | "widget";
  widgetType: string | null;
  isInner: boolean;
  settings: { [key: string]: JsonValue };
  elements: ElementNode[];
};

export const elementNodeSchema = z.lazy(() =>
  z
    .object({
      id: z.string().min(1).max(16),
      elType: z.enum(["container", "widget"]),
      widgetType: z.string().nullable(),
      isInner: z.boolean().default(false),
      settings: z.record(jsonValueSchema).default({}),
      elements: z.array(elementNodeSchema).default([]),
    })
    .superRefine((node, ctx) => {
      if (node.elType === "widget") {
        if (node.widgetType === null || !FREE_WIDGET_SET.has(node.widgetType)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `widgetType must be a free Elementor widget; got ${String(node.widgetType)}`,
          });
        }
        if (node.elements.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "widgets must not contain child elements",
          });
        }
      }
      if (node.elType === "container" && node.widgetType !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "containers must set widgetType to null",
        });
      }
    }),
) as z.ZodType<ElementNode>;

export const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug,
  isFrontPage: z.boolean().default(false),
  template: z.literal("elementor_header_footer").default("elementor_header_footer"),
  elements: z.array(elementNodeSchema).min(1),
});

export const kitTemplateSchema = z.object({
  title: z.string().min(1).max(120),
  elements: z.array(elementNodeSchema).default([]),
});

export const formFieldSchema = z.object({
  name: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  type: z.enum(["text", "email", "textarea", "tel", "number", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
});

export const formSchema = z.object({
  title: z.string().min(1).max(120),
  slug,
  fields: z.array(formFieldSchema).min(1),
});

const snippetLocation = z.enum(["header", "footer", "everywhere"]);

export const snippetSchema = z
  .object({
    title: z.string().min(1).max(120),
    code: z.string().min(1),
    type: z.enum(SNIPPET_TYPES),
    location: snippetLocation.optional(),
  })
  .superRefine((snippet, ctx) => {
    if (snippet.type !== "php" && snippet.location === "everywhere") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'WPCode Free: css, js, and html snippets must use location "header" or "footer". "everywhere" is PHP-only (insert-headers-and-footers).',
        path: ["location"],
      });
    }
  })
  .transform((snippet) => ({
    ...snippet,
    location: snippet.location ?? (snippet.type === "php" ? "everywhere" : "header"),
  }));

/** Dummy WooCommerce product — name, price, description, image only. */
export const wooProductSchema = z.object({
  name: z.string().min(1).max(120),
  price: z
    .string()
    .regex(/^\d+(?:\.\d{1,2})?$/, "price must be a number string like 19.99"),
  description: z.string().max(2000).default(""),
  imageMediaId: z.string().min(1).max(64),
});

/** Brandable Woo system page built with Free Elementor + shortcodes. */
export const wooSystemPageSchema = z.object({
  title: z.string().min(1).max(200),
  elements: z.array(elementNodeSchema).min(1),
});

export const wooPagesSchema = z
  .object({
    shop: wooSystemPageSchema.optional(),
    cart: wooSystemPageSchema.optional(),
    checkout: wooSystemPageSchema.optional(),
  })
  .default({});

export const wooSchema = z.object({
  enabled: z.boolean().default(false),
  products: z.array(wooProductSchema).max(4).default([]),
  pages: wooPagesSchema,
});

export const packageSchema = z
  .object({
    version: z.literal(1),
    theme: themeSchema,
    media: z.array(mediaItemSchema).default([]),
    pages: z.array(pageSchema).min(1),
    header: kitTemplateSchema.optional(),
    footer: kitTemplateSchema.optional(),
    forms: z.array(formSchema).default([]),
    snippets: z.array(snippetSchema).default([]),
    woocommerce: wooSchema.default({ enabled: false }),
    plugins: z.array(z.string().min(1)).default([...CORE_PLUGIN_SLUGS]),
  })
  .superRefine((pkg, ctx) => {
    const frontPages = pkg.pages.filter((page) => page.isFrontPage);
    if (frontPages.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exactly one page must set isFrontPage true",
        path: ["pages"],
      });
    }

    const slugs = pkg.pages.map((page) => page.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "page slugs must be unique",
        path: ["pages"],
      });
    }

    const required = new Set<string>(CORE_PLUGIN_SLUGS);
    if (pkg.woocommerce.enabled) {
      required.add(WOO_PLUGIN_SLUG);
    }
    for (const slugName of required) {
      if (!pkg.plugins.includes(slugName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `plugins must include ${slugName}`,
          path: ["plugins"],
        });
      }
    }
    if (!pkg.woocommerce.enabled && pkg.plugins.includes(WOO_PLUGIN_SLUG)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "woocommerce plugin must not be listed when woocommerce.enabled is false",
        path: ["plugins"],
      });
    }

    if (!pkg.woocommerce.enabled) {
      if (pkg.woocommerce.products.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "woocommerce.products require woocommerce.enabled true",
          path: ["woocommerce", "products"],
        });
      }
      if (
        pkg.woocommerce.pages.shop !== undefined ||
        pkg.woocommerce.pages.cart !== undefined ||
        pkg.woocommerce.pages.checkout !== undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "woocommerce.pages require woocommerce.enabled true",
          path: ["woocommerce", "pages"],
        });
      }
    }

    const mediaIds = new Set(pkg.media.map((item) => item.id));
    pkg.woocommerce.products.forEach((product, index) => {
      if (!mediaIds.has(product.imageMediaId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `product imageMediaId "${product.imageMediaId}" must match a media[].id`,
          path: ["woocommerce", "products", index, "imageMediaId"],
        });
      }
    });
  });

export type CtwPackage = z.infer<typeof packageSchema>;
export type CtwPage = z.infer<typeof pageSchema>;
export type CtwElementNode = ElementNode;
export type CtwMediaItem = z.infer<typeof mediaItemSchema>;
export type CtwSnippet = z.infer<typeof snippetSchema>;
export type CtwWooProduct = z.infer<typeof wooProductSchema>;
export type CtwWooSystemPage = z.infer<typeof wooSystemPageSchema>;

/**
 * Parse JSON into a typed package. Narrows at the boundary via Zod.
 */
export function parsePackageJson(input: JsonValue | { [key: string]: JsonValue }): CtwPackage {
  return packageSchema.parse(input);
}

export function safeParsePackageJson(
  input: JsonValue | { [key: string]: JsonValue },
): { success: true; data: CtwPackage } | { success: false; error: z.ZodError } {
  const result = packageSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function declaredPlugins(pkg: CtwPackage): string[] {
  const list: string[] = [...CORE_PLUGIN_SLUGS];
  if (pkg.woocommerce.enabled) {
    list.push(WOO_PLUGIN_SLUG);
  }
  return list;
}
