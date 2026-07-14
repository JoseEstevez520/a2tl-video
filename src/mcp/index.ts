#!/usr/bin/env node
/**
 * VDSL MCP Server
 *
 * Exposes VDSL as an MCP tool so AI agents can generate videos directly.
 *
 * Tools:
 *   render_video(spec, theme?, output?) — parse + compile + render a VDSL spec to MP4
 *   compile_video(spec, theme?) — parse + compile to JSX (no render)
 *   list_components() — list all available VDSL components
 *   list_themes() — list available themes
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseVDSL } from "../parser/index.js";
import { compile } from "../compiler/index.js";
import { themeNames } from "../themes/index.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

const COMPONENT_LIST = [
  // Layout
  "GridCanvas", "SplitScreen", "IconGrid", "SceneStack",
  // Text
  "WordReveal", "TextCycle", "TypewriterText", "FadeText", "Label",
  "Triptych", "StepSequence", "Byline", "QuoteBlock", "KineticText",
  // Diagrams
  "NodeGraph", "FlowDiagram", "BoundarySim", "WorkspaceDiagram",
  "Comparison", "ComparisonSlider", "Timeline", "MorphTransition",
  "ArchitectureDiagram", "ZoomReveal",
  // Code
  "CodeReveal", "TerminalReplay", "FileTreeWalk", "CodeDiff", "TypingCode",
  // Data
  "TraceLog", "ProtocolCompare", "FormulaCard", "AnimatedChart",
  "ProgressBar", "CountUp", "AnimatedCounter",
  // Ambient
  "ParticleField", "GlowOrb",
];

const server = new Server(
  { name: "vdsl", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "render_video",
      description:
        "Parse a VDSL spec and render it to an MP4 video. Returns the file path of the rendered video.",
      inputSchema: {
        type: "object" as const,
        properties: {
          spec: { type: "string", description: "The VDSL spec text (VDSL/1 format)" },
          theme: { type: "string", description: "Theme override (cobalt-grid, dark-tech, warm-editorial)" },
          output: { type: "string", description: "Output file path (default: auto-generated in temp)" },
        },
        required: ["spec"],
      },
    },
    {
      name: "compile_video",
      description:
        "Parse a VDSL spec and compile it to Remotion JSX (no rendering). Returns the generated JSX code.",
      inputSchema: {
        type: "object" as const,
        properties: {
          spec: { type: "string", description: "The VDSL spec text (VDSL/1 format)" },
          theme: { type: "string", description: "Theme override" },
        },
        required: ["spec"],
      },
    },
    {
      name: "list_components",
      description: "List all available VDSL video components with their categories.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "list_themes",
      description: "List all available VDSL themes.",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "compile_video": {
      const spec = args?.spec as string;
      if (!spec) return { content: [{ type: "text", text: "Error: spec is required" }] };

      try {
        const parsed = parseVDSL(spec);
        const themeName = (args?.theme as string) ?? parsed.theme ?? "cobalt-grid";
        const jsx = compile(parsed, { themeName, relativeImports: true });
        const scenes = parsed.scenes.length;
        const totalDur = parsed.scenes.reduce((s, sc) => s + sc.duration, 0);
        const tokens = Math.round(spec.length / 3.5);

        return {
          content: [{
            type: "text",
            text: `Compiled ${scenes} scenes (${totalDur}s) from ~${tokens} tokens.\n\n${jsx}`,
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Parse error: ${e.message}` }] };
      }
    }

    case "render_video": {
      const spec = args?.spec as string;
      if (!spec) return { content: [{ type: "text", text: "Error: spec is required" }] };

      try {
        const parsed = parseVDSL(spec);
        const themeName = (args?.theme as string) ?? parsed.theme ?? "cobalt-grid";
        const jsx = compile(parsed, { themeName, relativeImports: true });

        // Create temp workspace
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vdsl-mcp-"));
        const vdslRoot = path.resolve(__dirname, "..", "..");
        const srcRoot = fs.existsSync(path.join(vdslRoot, "src"))
          ? path.join(vdslRoot, "src")
          : vdslRoot;

        // Copy components + themes
        copyDir(path.join(srcRoot, "components"), path.join(tmpDir, "components"));
        copyDir(path.join(srcRoot, "themes"), path.join(tmpDir, "themes"));
        const typesFile = path.join(srcRoot, "parser", "types.ts");
        if (fs.existsSync(typesFile)) {
          fs.copyFileSync(typesFile, path.join(tmpDir, "types.ts"));
          fixThemeImports(path.join(tmpDir, "themes"));
        }

        fs.writeFileSync(path.join(tmpDir, "index.tsx"), jsx);
        fs.writeFileSync(path.join(tmpDir, "tsconfig.json"), JSON.stringify({
          compilerOptions: {
            target: "ES2020", module: "preserve", jsx: "react-jsx",
            strict: false, esModuleInterop: true, skipLibCheck: true,
            moduleResolution: "bundler", types: ["node"],
          },
          include: ["**/*.ts", "**/*.tsx"],
        }));
        fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({
          name: "vdsl-mcp-tmp", private: true,
          dependencies: {
            react: "^18", "react-dom": "^18", remotion: "^4",
            "@remotion/cli": "^4", typescript: "~5.8", "@types/react": "^18",
          },
        }));

        execSync("npm install --prefer-offline --silent", { cwd: tmpDir, stdio: "pipe" });

        const outPath = (args?.output as string) ??
          path.join(os.tmpdir(), `vdsl-${Date.now()}.mp4`);

        execSync(
          `npx remotion render index.tsx Video "${outPath}" --concurrency=50%`,
          { cwd: tmpDir, stdio: "pipe", timeout: 300000 }
        );

        // Cleanup
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

        const totalDur = parsed.scenes.reduce((s, sc) => s + sc.duration, 0);
        return {
          content: [{
            type: "text",
            text: `Rendered ${parsed.scenes.length} scenes (${totalDur}s) → ${outPath}`,
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Render error: ${e.message}` }] };
      }
    }

    case "list_components": {
      const categories: Record<string, string[]> = {
        Layout: COMPONENT_LIST.slice(0, 4),
        Text: COMPONENT_LIST.slice(4, 14),
        Diagrams: COMPONENT_LIST.slice(14, 24),
        Code: COMPONENT_LIST.slice(24, 29),
        Data: COMPONENT_LIST.slice(29, 36),
        Ambient: COMPONENT_LIST.slice(36),
      };

      let text = "VDSL Components (38 total):\n\n";
      for (const [cat, comps] of Object.entries(categories)) {
        text += `${cat} (${comps.length}):\n`;
        for (const c of comps) text += `  - ${c}\n`;
        text += "\n";
      }
      return { content: [{ type: "text", text }] };
    }

    case "list_themes": {
      return {
        content: [{
          type: "text",
          text: `Available themes:\n${themeNames.map((n) => `  - ${n}`).join("\n")}`,
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
});

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function fixThemeImports(themesDir: string): void {
  for (const file of fs.readdirSync(themesDir)) {
    if (file.endsWith(".ts")) {
      const fp = path.join(themesDir, file);
      let c = fs.readFileSync(fp, "utf-8");
      c = c.replace(/from\s+["']\.\.\/parser\/types["']/g, 'from "../types"');
      fs.writeFileSync(fp, c);
    }
  }
}

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
