import { calcAPCA, fontLookupAPCA } from "apca-w3";

import { contrastRatio, formatContrastRatio } from "./color";
import type { ContrastStandardId } from "../types";

type ContrastStandard =
  | {
      id: "wcag-aa" | "wcag-aaa" | "wcag-large";
      label: string;
      buttonLabel: string;
      description: string;
      method: "wcag";
      threshold: number;
      requirementLabel: string;
    }
  | {
      id: "apca-body";
      label: string;
      buttonLabel: string;
      description: string;
      method: "apca";
      fontSizePx: number;
      fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      requirementLabel: string;
    };

export type ContrastAssessment = {
  pass: boolean;
  score: number;
  scoreText: string;
  requirementText: string;
};

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
    label: "APCA Body Text",
    buttonLabel: "APCA",
    description:
      "Uses the official APCA lookup table for 16px, 400-weight body text.",
    method: "apca",
    fontSizePx: 16,
    fontWeight: 400,
    requirementLabel: "APCA body-text target for 16px regular text",
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
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
) {
  const lookup = fontLookupAPCA(Math.abs(score));
  const value = lookup[FONT_WEIGHT_COLUMN[fontWeight]];

  return typeof value === "number" ? value : null;
}

export function assessContrast(
  standardId: ContrastStandardId,
  textColor: string,
  backgroundColor: string,
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
  const minimumSize = getMinimumReadableSize(lcScore, standard.fontWeight);
  const pass = minimumSize !== null && minimumSize <= standard.fontSizePx;

  return {
    pass,
    score: lcScore,
    scoreText: formatApcaScore(lcScore),
    requirementText: standard.requirementLabel,
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

export function getLegendText(standardId: ContrastStandardId) {
  const standard = getContrastStandard(standardId);

  if (standard.method === "wcag") {
    return `Please don't use these color combinations; they do not meet ${standard.label} for body text. ${standard.requirementLabel}.`;
  }

  return "Please don't use these color combinations for APCA body text; they do not meet the official APCA lookup guidance for 16px, 400-weight text.";
}
