import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG } from "@ctw/schema";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the repo or @ctw/cli package root (src, dist, or root bundle).
 */
function packageRoot(): string {
  let dir = here;
  for (let i = 0; i < 8; i += 1) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const name = (JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string }).name;
      if (name === "@ctw/cli" || name === "claude-to-wordpress-native") {
        return dir;
      }
    }
    dir = resolve(dir, "..");
  }
  return resolve(here, "..");
}

/**
 * Directory of skill markdown shipped with the CLI package.
 */
export function skillAssetsDir(): string {
  const root = packageRoot();
  const candidates = [
    join(root, "skill-assets"),
    join(root, "packages/cli/skill-assets"),
    join(root, "skills/ctw-native"),
    join(root, "../../skills/ctw-native"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "SKILL.md"))) {
      return dir;
    }
  }
  throw new Error(
    "CTW skill assets not found. Reinstall the package or run npm run build in the monorepo.",
  );
}

export type SkillInstallResult = {
  targetDir: string;
  created: boolean;
};

/**
 * Install the Claude Code skills into .claude/skills/ctw-native
 * and .claude/skills/ctw-native-check.
 */
export function installSkill(projectRoot: string): SkillInstallResult {
  const root = resolve(projectRoot);
  const targetDir = join(root, ".claude", "skills", "ctw-native");
  const checkDir = join(root, ".claude", "skills", "ctw-native-check");
  const source = skillAssetsDir();
  const existed = existsSync(join(targetDir, "SKILL.md"));
  mkdirSync(targetDir, { recursive: true });
  copyMainSkill(source, targetDir);
  const checkSource = join(source, "check", "SKILL.md");
  if (existsSync(checkSource)) {
    mkdirSync(checkDir, { recursive: true });
    writeFileSync(join(checkDir, "SKILL.md"), readFileSync(checkSource, "utf8"));
  }
  return { targetDir, created: !existed };
}

/**
 * Copy packaged skill files except the nested check skill folder.
 */
function copyMainSkill(source: string, targetDir: string): void {
  for (const name of readdirSync(source)) {
    if (name === "check") {
      continue;
    }
    cpSync(join(source, name), join(targetDir, name), { recursive: true });
  }
}

export type InitResult = {
  packagePath: string;
  skill: SkillInstallResult;
  mediaDir: string;
};

/**
 * Scaffold a starter ctw-package.json, media folder, and Claude Code skill.
 */
export function initProject(
  projectRoot: string,
  themeSlug: string,
  themeName: string,
  options?: { woocommerce?: boolean },
): InitResult {
  const root = resolve(projectRoot);
  const packagePath = join(root, "ctw-package.json");
  const mediaDir = join(root, "media");
  mkdirSync(mediaDir, { recursive: true });

  if (!existsSync(packagePath)) {
    writeFileSync(
      packagePath,
      starterPackageJson(themeSlug, themeName, options?.woocommerce === true),
      "utf8",
    );
  }

  const skill = installSkill(root);
  return { packagePath, skill, mediaDir };
}

function starterPackageJson(themeSlug: string, themeName: string, wooEnabled: boolean): string {
  const plugins = wooEnabled
    ? [...CORE_PLUGIN_SLUGS, WOO_PLUGIN_SLUG]
    : [...CORE_PLUGIN_SLUGS];
  const body = {
    version: 1,
    theme: {
      slug: themeSlug,
      name: themeName,
      colors: { primary: "#0B3D91" },
      typography: {},
      menus: [
        {
          location: "menu-1",
          name: "Primary",
          items: [{ title: "Home", pageSlug: "home" }],
        },
      ],
    },
    media: [],
    pages: [
      {
        title: "Home",
        slug: "home",
        isFrontPage: true,
        template: "elementor_header_footer",
        elements: [
          {
            id: "home001",
            elType: "container",
            widgetType: null,
            isInner: false,
            settings: {
              content_width: "full",
              flex_direction: "column",
            },
            elements: [
              {
                id: "home002",
                elType: "widget",
                widgetType: "heading",
                isInner: false,
                settings: { title: themeName, header_size: "h1" },
                elements: [],
              },
              {
                id: "home003",
                elType: "widget",
                widgetType: "text-editor",
                isInner: false,
                settings: { editor: "<p>Replace this copy with your brief.</p>" },
                elements: [],
              },
            ],
          },
        ],
      },
    ],
    forms: [],
    snippets: [],
    woocommerce: { enabled: wooEnabled },
    plugins,
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

/**
 * Read the packaged skill text (for tests).
 */
export function readSkillMarkdown(): string {
  return readFileSync(join(skillAssetsDir(), "SKILL.md"), "utf8");
}
