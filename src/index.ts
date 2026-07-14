/**
 * VDSL — Video Description Language
 * Main package entry point.
 */

export { parseVDSL } from "./parser";
export { compile } from "./compiler";
export type { CompileOptions } from "./compiler";
export { themes, resolveTheme, themeNames } from "./themes";
export type { Theme } from "./themes";

// Re-export types from parser
export type {
  VDSLSpec,
  Scene,
  Component,
  Timing,
  FontStyle,
  Position,
  RevealStyle,
  AccentStyle,
  Transition,
  ComparisonAnimation,
  VizType,
  TextComponent,
  TextCycleComponent,
  TextCyclePhrase,
  LabelComponent,
  TriptychComponent,
  TriptychItem,
  StepSequenceComponent,
  StepSequenceItem,
  ComparisonComponent,
  ComparisonSide,
  CardComponent,
  CardChild,
  CodeComponent,
  CodeModifier,
  TraceLogComponent,
  TraceLogEntry,
  VizComponent,
  BylineComponent,
} from "./parser/types";
