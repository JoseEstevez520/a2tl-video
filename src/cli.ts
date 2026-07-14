#!/usr/bin/env node
/**
 * VDSL CLI
 *
 * Commands:
 *   vdsl compile <input.vdsl> [-o output.jsx]
 *   vdsl render  <input.vdsl> [-o output.mp4] [--theme <name>]
 *   vdsl themes
 *   vdsl init    <name>
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync, spawnSync } from "child_process";

import { parseVDSL } from "./parser";
import { compile } from "./compiler";
import { themes, themeNames } from "./themes";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // strip node + script
  const command = args[0] ?? "help";
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[i + 1];
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        flags[key] = args[i + 1];
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { command, positional, flags };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readVDSL(inputPath: string): string {
  const resolved = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolved)) {
    die(`File not found: ${resolved}`);
  }
  return fs.readFileSync(resolved, "utf-8");
}

function die(msg: string): never {
  console.error(`\x1b[31merror:\x1b[0m ${msg}`);
  process.exit(1);
}

function info(msg: string): void {
  console.log(`\x1b[36m→\x1b[0m ${msg}`);
}

function ok(msg: string): void {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

// ---------------------------------------------------------------------------
// Command: compile
// ---------------------------------------------------------------------------

function cmdCompile(positional: string[], flags: Record<string, string | boolean>): void {
  const inputFile = positional[0];
  if (!inputFile) die("Usage: vdsl compile <input.vdsl> [-o output.jsx]");

  const source = readVDSL(inputFile);
  const spec = parseVDSL(source);
  const themeName = (flags["theme"] as string) ?? spec.theme ?? "cobalt-grid";
  const jsx = compile(spec, { themeName });

  const defaultOut = path.join(
    path.dirname(path.resolve(inputFile)),
    path.basename(inputFile, path.extname(inputFile)) + ".jsx"
  );
  const outPath = (flags["o"] as string) ?? (flags["output"] as string) ?? defaultOut;

  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(path.resolve(outPath), jsx, "utf-8");
  ok(`Compiled → ${outPath}`);
}

// ---------------------------------------------------------------------------
// Command: render
// ---------------------------------------------------------------------------

function cmdRender(positional: string[], flags: Record<string, string | boolean>): void {
  const inputFile = positional[0];
  if (!inputFile) die("Usage: vdsl render <input.vdsl> [-o output.mp4] [--theme <name>]");

  const source = readVDSL(inputFile);
  const spec = parseVDSL(source);
  const themeName = (flags["theme"] as string) ?? spec.theme ?? "cobalt-grid";
  const jsx = compile(spec, { themeName });

  // Compute total duration for config
  const totalFrames = spec.scenes.reduce(
    (sum, scene) => sum + Math.round(scene.duration * 30),
    0
  );
  const width = spec.canvas?.width ?? 1920;
  const height = spec.canvas?.height ?? 1080;

  // Create a temp Remotion project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vdsl-render-"));
  info(`Temp project: ${tmpDir}`);

  try {
    // Write Video.jsx
    const videoJsxPath = path.join(tmpDir, "Video.jsx");
    fs.writeFileSync(videoJsxPath, jsx, "utf-8");

    // Write Root.jsx
    const rootContent = buildRemotionRoot("Video", totalFrames, 30, width, height);
    fs.writeFileSync(path.join(tmpDir, "Root.jsx"), rootContent, "utf-8");

    // Write index.js (Remotion entry)
    const indexContent = buildRemotionIndex();
    fs.writeFileSync(path.join(tmpDir, "index.js"), indexContent, "utf-8");

    // Write remotion.config.js
    const configContent = buildRemotionConfig();
    fs.writeFileSync(path.join(tmpDir, "remotion.config.js"), configContent, "utf-8");

    // Write package.json
    const pkgContent = buildTmpPackageJson();
    fs.writeFileSync(path.join(tmpDir, "package.json"), pkgContent, "utf-8");

    // Install dependencies
    info("Installing remotion dependencies…");
    const installResult = spawnSync("npm", ["install", "--prefer-offline", "--silent"], {
      cwd: tmpDir,
      stdio: "inherit",
      shell: true,
    });
    if (installResult.status !== 0) {
      die("npm install failed — ensure Node and npm are available.");
    }

    // Determine output path
    const defaultMp4 = path.join(
      path.dirname(path.resolve(inputFile)),
      path.basename(inputFile, path.extname(inputFile)) + ".mp4"
    );
    const outPath = path.resolve(
      (flags["o"] as string) ?? (flags["output"] as string) ?? defaultMp4
    );

    info(`Rendering with Remotion → ${outPath}`);

    const renderResult = spawnSync(
      "npx",
      [
        "remotion",
        "render",
        "index.js",           // entry point
        "Video",              // composition id
        outPath,
      ],
      {
        cwd: tmpDir,
        stdio: "inherit",
        shell: true,
      }
    );

    if (renderResult.status !== 0) {
      die("Remotion render failed. Check the output above.");
    }

    ok(`Rendered → ${outPath}`);
  } finally {
    // Clean up temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // non-fatal
    }
  }
}

function buildRemotionRoot(
  componentName: string,
  durationInFrames: number,
  fps: number,
  width: number,
  height: number
): string {
  return [
    `import React from 'react';`,
    `import { Composition } from 'remotion';`,
    `import { ${componentName} } from './Video.jsx';`,
    ``,
    `export const RemotionRoot = () => (`,
    `  <Composition`,
    `    id="${componentName}"`,
    `    component={${componentName}}`,
    `    durationInFrames={${durationInFrames}}`,
    `    fps={${fps}}`,
    `    width={${width}}`,
    `    height={${height}}`,
    `  />`,
    `);`,
  ].join("\n");
}

function buildRemotionIndex(): string {
  return [
    `import { registerRoot } from 'remotion';`,
    `import { RemotionRoot } from './Root.jsx';`,
    `registerRoot(RemotionRoot);`,
  ].join("\n");
}

function buildRemotionConfig(): string {
  return [
    `import { Config } from '@remotion/cli/config';`,
    `Config.setVideoImageFormat('jpeg');`,
    `Config.setOverwriteOutput(true);`,
  ].join("\n");
}

function buildTmpPackageJson(): string {
  return JSON.stringify(
    {
      name: "vdsl-render-tmp",
      version: "0.0.1",
      private: true,
      dependencies: {
        react: "^18",
        "react-dom": "^18",
        remotion: "^4",
        "@remotion/cli": "^4",
        vdsl: "*",
      },
    },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
// Command: themes
// ---------------------------------------------------------------------------

function cmdThemes(): void {
  console.log("\nAvailable VDSL themes:\n");
  for (const name of themeNames) {
    const theme = themes[name];
    const grid = theme.grid ? "  [grid]" : "";
    console.log(`  \x1b[36m${name}\x1b[0m${grid}`);
    console.log(`    bg: ${theme.colors.bg}  ink: ${theme.colors.ink}`);
    console.log(`    display: ${theme.fonts.display}`);
    console.log();
  }
}

// ---------------------------------------------------------------------------
// Command: init
// ---------------------------------------------------------------------------

const TEMPLATE = (name: string): string => `// ${name}.vdsl — VDSL Video Description
VDSL/1
theme cobalt-grid
canvas 1920x1080

scene "${name}" 5s cut
  text "Hello, World!" display center word-stagger 0-4s
  byline "Made with VDSL" bottom-center 4-5s
`;

function cmdInit(positional: string[]): void {
  const name = positional[0];
  if (!name) die("Usage: vdsl init <name>");

  const filename = name.endsWith(".vdsl") ? name : `${name}.vdsl`;
  const outPath = path.resolve(process.cwd(), filename);

  if (fs.existsSync(outPath)) {
    die(`File already exists: ${outPath}`);
  }

  fs.writeFileSync(outPath, TEMPLATE(path.basename(name, ".vdsl")), "utf-8");
  ok(`Created ${filename}`);
  console.log(`\nNext steps:`);
  console.log(`  vdsl compile ${filename}`);
  console.log(`  vdsl render  ${filename}`);
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function cmdHelp(): void {
  console.log(`
\x1b[1mVDSL\x1b[0m — Video Description Language

\x1b[1mUsage:\x1b[0m
  vdsl compile <input.vdsl> [-o output.jsx] [--theme <name>]
  vdsl render  <input.vdsl> [-o output.mp4]  [--theme <name>]
  vdsl themes
  vdsl init    <name>

\x1b[1mExamples:\x1b[0m
  vdsl init my-explainer
  vdsl compile my-explainer.vdsl
  vdsl render  my-explainer.vdsl -o out.mp4 --theme dark-tech
  vdsl themes
`);
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function main(): void {
  const { command, positional, flags } = parseArgs(process.argv);

  switch (command) {
    case "compile": return cmdCompile(positional, flags);
    case "render":  return cmdRender(positional, flags);
    case "themes":  return cmdThemes();
    case "init":    return cmdInit(positional);
    case "help":
    case "--help":
    case "-h":
    default:
      return cmdHelp();
  }
}

main();
