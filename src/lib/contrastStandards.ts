import { calcAPCA, fontLookupAPCA } from "apca-w3";

import { contrastRatio, formatContrastRatio } from "./color";
import type {
  ApcaTypographySettings,
  ContrastStandardId,
  FontWeightOption,
} from "../types";

type WcagContrastStandard = {
  id: "wcag-aa" | "wcag-aaa" | "wcag-large";
  label: string;
  buttonLabel: string;
  description: string;
  method: "wcag";
  threshold: number;
  requirementLabel: string;
};

type ApcaContrastStandard = {
  id: "apca-body";
  label: string;
  buttonLabel: string;
  description: string;
  method: "apca";
};

type ContrastStandard = WcagContrastStandard | ApcaContrastStandard;

export type ContrastAssessment = {
  pass: boolean;
  score: number;
  scoreText: string;
  requirementText: string;
};

export const DEFAULT_APCA_TYPOGRAPHY: ApcaTypographySettings = {
  fontSizePx: 16,
  fontWeight: 400,
};

export const APCA_FONT_WEIGHT_OPTIONS: FontWeightOption[] = [
  100, 200, 300, 400, 500, 600, 700, 800, 900,
];

const FONT_WEIGHT_COLUMN = {
  100: 1,
  200: 2,
  300: 3,
  400: 4,
  500: 5,
  600: 6,
  700: 7,
  800: 8,
  900: 9,
} as const;

export const contrastStandards: ContrastStandard[] = [
  {
    id: "wcag-aa",
    label: "WCAG AA",
    buttonLabel: "AA",
    description: "Passes the WCAG 2 normal-text threshold of 4.5:1.",
    method: "wcag",
    threshold: 4.5,
    requirementLabel: "4.5:1 minimum for normal text",
  },
  {
    id: "wcag-aaa",
    label: "WCAG AAA",
    buttonLabel: "AAA",
    description: "Passes the stricter WCAG 2 AAA threshold of 7:1.",
    method: "wcag",
    threshold: 7,
    requirementLabel: "7:1 minimum for enhanced readability",
  },
  {
    id: "wcag-large",
    label: "WCAG Large Text",
    buttonLabel: "Large Text",
    description: "Passes the WCAG 2 large-text threshold of 3:1.",
    method: "wcag",
    threshold: 3,
    requirementLabel: "3:1 minimum for large or bold display text",
  },
  {
    id: "apca-body",
    label: "APCA",
    buttonLabel: "APCA",
    description:
      "Uses the official APCA lookup table for the selected text size and weight.",
    method: "apca",
  },
];

export function getContrastStandard(id: ContrastStandardId) {
  return contrastStandards.find((standard) => standard.id === id) ?? contrastStandards[0];
}

function formatApcaScore(score: number) {
  return `Lc ${Math.abs(score).toFixed(1)}`;
}

function getMinimumReadableSize(
  score: number,
  fontWeight: FontWeightOption,
) {
  const lookup = fontLookupAPCA(Math.abs(score));
  const value = lookup[FONT_WEIGHT_COLUMN[fontWeight]];

  return typeof value === "number" ? value : null;
}

function formatApcaRequirement(settings: ApcaTypographySettings) {
  return `Requires at least Lc support for ${settings.fontSizePx}px at weight ${settings.fontWeight}`;
}

export function getApcaTypographySummary(settings: ApcaTypographySettings) {
  return `${settings.fontSizePx}px text at ${settings.fontWeight} weight`;
}

export function clampApcaFontSize(fontSizePx: number) {
  return Math.max(8, Math.min(120, Math.round(fontSizePx || DEFAULT_APCA_TYPOGRAPHY.fontSizePx)));
}

export function parseApcaFontWeight(value: string): FontWeightOption {
  const parsed = Number.parseInt(value, 10) as FontWeightOption;

  return APCA_FONT_WEIGHT_OPTIONS.includes(parsed)
    ? parsed
    : DEFAULT_APCA_TYPOGRAPHY.fontWeight;
}

export function assessContrast(
  standardId: ContrastStandardId,
  textColor: string,
  backgroundColor: string,
  apcaTypography: ApcaTypographySettings = DEFAULT_APCA_TYPOGRAPHY,
) {
  const standard = getContrastStandard(standardId);

  if (standard.method === "wcag") {
    const ratio = contrastRatio(backgroundColor, textColor);

    return {
      pass: ratio >= standard.threshold,
      score: ratio,
      scoreText: formatContrastRatio(ratio),
      requirementText: standard.requirementLabel,
    } satisfies ContrastAssessment;
  }

  const lcScore = calcAPCA(textColor, backgroundColor);
  const minimumSize = getMinimumReadableSize(lcScore, apcaTypography.fontWeight);
  const pass = minimumSize !== null && minimumSize <= apcaTypography.fontSizePx;

  return {
    pass,
    score: lcScore,
    scoreText: formatApcaScore(lcScore),
    requirementText: formatApcaRequirement(apcaTypography),
  } satisfies ContrastAssessment;
}

export function buildPassingText(
  standardId: ContrastStandardId,
  backgroundName: string,
  foregroundName: string,
  assessment: ContrastAssessment,
) {
  const standard = getContrastStandard(standardId);

  return `The ${standard.label} score for ${foregroundName} on ${backgroundName} is ${assessment.scoreText}.`;
}

export function buildFailingText(
  standardId: ContrastStandardId,
  backgroundName: string,
  foregroundName: string,
  assessment: ContrastAssessment,
) {
  const standard = getContrastStandard(standardId);

  return `Do not use ${foregroundName} text on ${backgroundName} background for ${standard.label}; it scores ${assessment.scoreText}.`;
}

export function getLegendText(
  standardId: ContrastStandardId,
  apcaTypography: ApcaTypographySettings = DEFAULT_APCA_TYPOGRAPHY,
) {
  const standard = getContrastStandard(standardId);

  if (standard.method === "wcag") {
    return `Please don't use these color combinations; they do not meet ${standard.label} for body text. ${standard.requirementLabel}.`;
  }

  return `Please don't use these color combinations for APCA when evaluating ${getApcaTypographySummary(apcaTypography)}; they do not meet the official APCA lookup guidance for that typography.`;
}
