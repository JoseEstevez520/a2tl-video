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

  // Compile with relative imports so the workspace is self-contained
  const jsx = compile(spec, { themeName, relativeImports: true });

  // Create a temp Remotion project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vdsl-render-"));
  info(`Workspace: ${tmpDir}`);

  try {
    // Copy VDSL components and themes into the workspace
    const vdslRoot = path.resolve(__dirname, "..");
    const srcRoot = fs.existsSync(path.join(vdslRoot, "src")) ? path.join(vdslRoot, "src") : vdslRoot;

    copyDirRecursive(
      path.join(srcRoot, "components"),
      path.join(tmpDir, "components")
    );
    copyDirRecursive(
      path.join(srcRoot, "themes"),
      path.join(tmpDir, "themes")
    );

    // Copy parser/types.ts (themes import it)
    const typesSource = path.join(srcRoot, "parser", "types.ts");
    if (fs.existsSync(typesSource)) {
      fs.copyFileSync(typesSource, path.join(tmpDir, "types.ts"));
      // Fix theme imports from ../parser/types to ../types
      fixThemeImports(path.join(tmpDir, "themes"));
    }

    // Write the compiled entry point (it includes registerRoot + Composition)
    fs.writeFileSync(path.join(tmpDir, "index.tsx"), jsx, "utf-8");

    // Write tsconfig.json
    fs.writeFileSync(path.join(tmpDir, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        module: "preserve",
        jsx: "react-jsx",
        strict: false,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: "bundler",
        types: ["node"],
      },
      include: ["**/*.ts", "**/*.tsx"],
    }, null, 2), "utf-8");

    // Write package.json (no vdsl dependency — components are local)
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({
      name: "vdsl-render-tmp",
      version: "0.0.1",
      private: true,
      dependencies: {
        react: "^18",
        "react-dom": "^18",
        remotion: "^4",
        "@remotion/cli": "^4",
        typescript: "~5.8",
        "@types/react": "^18",
      },
    }, null, 2), "utf-8");

    // Install dependencies
    info("Installing dependencies…");
    try {
      execSync("npm install --prefer-offline --silent", {
        cwd: tmpDir,
        stdio: "pipe",
      });
    } catch (e: any) {
      const stderr = e?.stderr?.toString() ?? "";
      die(`npm install failed: ${stderr.slice(0, 300)}`);
    }

    // Determine output path
    const defaultMp4 = path.join(
      path.dirname(path.resolve(inputFile)),
      path.basename(inputFile, path.extname(inputFile)) + ".mp4"
    );
    const outPath = path.resolve(
      (flags["o"] as string) ?? (flags["output"] as string) ?? defaultMp4
    );

    info(`Rendering → ${outPath}`);

    try {
      const result = execSync(`npx remotion render index.tsx Video "${outPath}" --concurrency=50%`, {
        cwd: tmpDir,
        stdio: "pipe",
        timeout: 300000,
      });
      console.log(result.toString().split("\n").slice(-5).join("\n"));
    } catch (e: any) {
      const stderr = e?.stderr?.toString() ?? "";
      const stdout = e?.stdout?.toString() ?? "";
      console.error(stdout.slice(-500));
      console.error(stderr.slice(-500));
      die("Remotion render failed.");
    }

    ok(`Rendered → ${outPath}`);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // non-fatal
    }
  }
}

/** Recursively copy a directory */
function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Fix theme imports from ../parser/types to ../types */
function fixThemeImports(themesDir: string): void {
  for (const file of fs.readdirSync(themesDir)) {
    if (file.endsWith(".ts")) {
      const filePath = path.join(themesDir, file);
      let content = fs.readFileSync(filePath, "utf-8");
      content = content.replace(/from\s+["']\.\.\/parser\/types["']/g, 'from "../types"');
      fs.writeFileSync(filePath, content, "utf-8");
    }
  }
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
