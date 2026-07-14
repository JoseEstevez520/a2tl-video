/**
 * VDSL Theme Registry
 *
 * All built-in themes are registered here and exported as the `themes` map.
 * Theme keys match the `theme:` directive in .vdsl source files.
 */

import type { Theme } from "../parser/types";
import { cobaltGrid } from "./cobalt-grid";
import { darkTech } from "./dark-tech";
import { warmEditorial } from "./warm-editorial";

export type { Theme };

export const themes: Record<string, Theme> = {
  "cobalt-grid": cobaltGrid,
  "dark-tech": darkTech,
  "warm-editorial": warmEditorial,
};

/** Returns the theme for `name`, falling back to cobalt-grid if unknown. */
export function resolveTheme(name: string): Theme {
  return themes[name] ?? cobaltGrid;
}

/** List of all available theme names. */
export const themeNames: string[] = Object.keys(themes);
