import { areColorsIndistinguishable } from "./color";
import {
  assessContrast,
  getApcaTypographySummary,
  getContrastStandard,
} from "./contrastStandards";
import type {
  ApcaTypographySettings,
  ContrastStandardId,
  MatrixSvgArtifact,
  PaletteEntry,
} from "../types";

type BuildContrastMatrixSvgOptions = {
  apcaTypography: ApcaTypographySettings;
  palette: PaletteEntry[];
  standardId: ContrastStandardId;
};

const ARTBOARD_BACKGROUND = "#FFFFFF";
const CANVAS_BACKGROUND = "#FAFAFA";
const BORDER = "#E4E4E7";
const DASHED_BORDER = "#D4D4D8";
const FOREGROUND = "#09090B";
const MUTED_FOREGROUND = "#71717A";
const MUTED_SURFACE = "#F4F4F5";
const HEADER_SURFACE = "#FCFCFD";
const PASS_BADGE = "#18181B";
const PASS_BADGE_TEXT = "#FAFAFA";
const FAIL_BADGE = "#F4F4F5";
const FAIL_BADGE_TEXT = "#18181B";
const PILL_SURFACE = "#F4F4F5";
const PILL_TEXT = "#18181B";
const FONT_FAMILY = "Inter, Inter Variable, ui-sans-serif, system-ui, sans-serif";

const PAD = 32;
const GAP = 12;
const TITLE_HEIGHT = 88;
const ROW_LABEL_WIDTH = 196;
const HEADER_HEIGHT = 108;
const CELL_WIDTH = 136;
const CELL_HEIGHT = 104;
const SURFACE_RADIUS = 16;
const ARTBOARD_RADIUS = 28;

function getPreviewTextMarkup(
  textColor: string,
  backgroundColor: string,
  x: number,
  y: number,
) {
  const hasStroke = areColorsIndistinguishable(textColor, backgroundColor);

  return `<text class="preview-label" x="${x}" y="${y}" fill="${textColor}" ${hasStroke ? 'stroke="#18181B" stroke-width="0.9" paint-order="stroke fill"' : ""}>Aa</text>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncateLabel(value: string, maxCharacters = 22) {
  if (value.length <= maxCharacters) {
    return value;
  }

  return `${value.slice(0, maxCharacters - 1)}…`;
}

function buildSummary(
  standardId: ContrastStandardId,
  apcaTypography: ApcaTypographySettings,
) {
  const standard = getContrastStandard(standardId);

  if (standardId === "apca-body") {
    return `${standard.label} · ${getApcaTypographySummary(apcaTypography)}`;
  }

  return `${standard.label} · ${standard.description.replace(/\.$/, "")}`;
}

function line(label: string, x: number, y: number, className: string) {
  return `<text class="${className}" x="${x}" y="${y}">${escapeXml(label)}</text>`;
}

function renderTextSwatch(
  textColor: string,
  x: number,
  y: number,
  size: number,
) {
  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="${ARTBOARD_BACKGROUND}" stroke="${BORDER}" />`,
    getPreviewTextMarkup(textColor, ARTBOARD_BACKGROUND, x + size / 2, y + size / 2 + 6),
  ].join("");
}

function renderBackgroundSwatch(
  backgroundColor: string,
  textColor: string,
  x: number,
  y: number,
  size: number,
) {
  const border =
    areColorsIndistinguishable(backgroundColor, ARTBOARD_BACKGROUND)
      ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="none" stroke="${BORDER}" />`
      : "";

  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="${backgroundColor}" />`,
    border,
    getPreviewTextMarkup(
      textColor,
      backgroundColor,
      x + size / 2,
      y + size / 2 + 6,
    ),
  ].join("");
}

function renderPill(label: string, x: number, y: number) {
  const width = 24 + label.length * 7;

  return [
    `<rect x="${x}" y="${y}" width="${width}" height="28" rx="14" fill="${PILL_SURFACE}" stroke="${BORDER}" />`,
    `<text class="pill" x="${x + width / 2}" y="${y + 18}">${escapeXml(label)}</text>`,
  ].join("");
}

function renderHeaderCard(entry: PaletteEntry, x: number, y: number) {
  const secondaryLine =
    entry.name.toUpperCase() === entry.color.toUpperCase() ? null : entry.color.toUpperCase();

  return [
    `<rect x="${x}" y="${y}" width="${CELL_WIDTH}" height="${HEADER_HEIGHT}" rx="${SURFACE_RADIUS}" fill="${HEADER_SURFACE}" stroke="${BORDER}" />`,
    renderTextSwatch(entry.color, x + 16, y + 16, 44),
    line(truncateLabel(entry.name), x + 16, y + 78, "label"),
    secondaryLine ? line(secondaryLine, x + 16, y + 96, "muted-label") : "",
  ].join("");
}

function renderRowLabel(entry: PaletteEntry, x: number, y: number) {
  const secondaryLine =
    entry.name.toUpperCase() === entry.color.toUpperCase() ? null : entry.color.toUpperCase();

  return [
    `<rect class="surface" x="${x}" y="${y}" width="${ROW_LABEL_WIDTH}" height="${CELL_HEIGHT}" rx="${SURFACE_RADIUS}" />`,
    renderBackgroundSwatch(entry.color, FOREGROUND, x + 16, y + 16, 44),
    line(truncateLabel(entry.name), x + 74, y + 44, "label"),
    secondaryLine ? line(secondaryLine, x + 74, y + 64, "muted-label") : "",
  ].join("");
}

function renderMatrixCell(
  background: PaletteEntry,
  foreground: PaletteEntry,
  x: number,
  y: number,
  standardId: ContrastStandardId,
  apcaTypography: ApcaTypographySettings,
) {
  const assessment = assessContrast(
    standardId,
    foreground.color,
    background.color,
    apcaTypography,
  );
  const isPassing = assessment.pass;

  return [
    `<rect x="${x}" y="${y}" width="${CELL_WIDTH}" height="${CELL_HEIGHT}" rx="${SURFACE_RADIUS}" fill="${isPassing ? ARTBOARD_BACKGROUND : MUTED_SURFACE}" stroke="${isPassing ? BORDER : DASHED_BORDER}" ${isPassing ? "" : 'stroke-dasharray="5 4"'} />`,
    renderBackgroundSwatch(background.color, foreground.color, x + 16, y + 16, 42),
    `<rect x="${x + 68}" y="${y + 16}" width="52" height="24" rx="12" fill="${isPassing ? PASS_BADGE : FAIL_BADGE}" />`,
    `<text class="score" x="${x + 94}" y="${y + 33}" fill="${isPassing ? PASS_BADGE_TEXT : FAIL_BADGE_TEXT}">${escapeXml(assessment.scoreText)}</text>`,
    line(truncateLabel(foreground.name, 18), x + 16, y + 78, "label"),
    line("on", x + 16, y + 95, "muted-label"),
    line(truncateLabel(background.name, 18), x + 36, y + 95, "muted-label"),
  ].join("");
}

export function buildContrastMatrixSvg({
  apcaTypography,
  palette,
  standardId,
}: BuildContrastMatrixSvgOptions): MatrixSvgArtifact {
  const title = "Contrast matrix";
  const summary = buildSummary(standardId, apcaTypography);
  const pairingsLabel = `${palette.length * palette.length} pairings`;
  const standardLabel = getContrastStandard(standardId).label;
  const width =
    PAD * 2 + ROW_LABEL_WIDTH + GAP + palette.length * CELL_WIDTH + Math.max(0, palette.length - 1) * GAP;
  const height =
    PAD * 2 +
    TITLE_HEIGHT +
    HEADER_HEIGHT +
    GAP +
    palette.length * CELL_HEIGHT +
    Math.max(0, palette.length - 1) * GAP;
  const matrixLeft = PAD + ROW_LABEL_WIDTH + GAP;
  const matrixTop = PAD + TITLE_HEIGHT + HEADER_HEIGHT + GAP;
  const headerTop = PAD + TITLE_HEIGHT;
  const titleBaseline = PAD + 18;
  const summaryBaseline = PAD + 42;
  const axisBaseline = PAD + 72;
  const pairingsPillWidth = 24 + pairingsLabel.length * 7;
  const standardPillWidth = 24 + standardLabel.length * 7;
  const pairingsPillX = width - PAD - pairingsPillWidth;
  const standardPillX = pairingsPillX - 8 - standardPillWidth;

  const markup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`,
    "<style>",
    `text { font-family: ${FONT_FAMILY}; }`,
    `.surface { fill: ${ARTBOARD_BACKGROUND}; stroke: ${BORDER}; }`,
    `.title { font-size: 24px; font-weight: 600; fill: ${FOREGROUND}; }`,
    `.summary { font-size: 14px; font-weight: 500; fill: ${MUTED_FOREGROUND}; }`,
    `.axis-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; fill: ${MUTED_FOREGROUND}; }`,
    `.label { font-size: 13px; font-weight: 600; fill: ${FOREGROUND}; }`,
    `.muted-label { font-size: 12px; font-weight: 500; fill: ${MUTED_FOREGROUND}; }`,
    `.preview-label { font-size: 18px; font-weight: 700; text-anchor: middle; }`,
    `.score { font-size: 11px; font-weight: 700; text-anchor: middle; }`,
    `.pill { font-size: 12px; font-weight: 600; text-anchor: middle; fill: ${PILL_TEXT}; }`,
    "</style>",
    `<rect width="${width}" height="${height}" rx="${ARTBOARD_RADIUS}" fill="${CANVAS_BACKGROUND}" />`,
    `<rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="24" fill="${ARTBOARD_BACKGROUND}" stroke="${BORDER}" />`,
    `<text class="title" x="${PAD}" y="${titleBaseline}">${escapeXml(title)}</text>`,
    `<text class="summary" x="${PAD}" y="${summaryBaseline}">${escapeXml(summary)}</text>`,
    line("Background", PAD, axisBaseline, "axis-label"),
    line("Foreground", matrixLeft, axisBaseline, "axis-label"),
    renderPill(standardLabel, standardPillX, PAD),
    renderPill(pairingsLabel, pairingsPillX, PAD),
    palette
      .map((entry, index) =>
        renderHeaderCard(entry, matrixLeft + index * (CELL_WIDTH + GAP), headerTop),
      )
      .join(""),
    palette
      .map((entry, index) =>
        renderRowLabel(entry, PAD, matrixTop + index * (CELL_HEIGHT + GAP)),
      )
      .join(""),
    palette
      .flatMap((background, rowIndex) =>
        palette.map((foreground, columnIndex) =>
          renderMatrixCell(
            background,
            foreground,
            matrixLeft + columnIndex * (CELL_WIDTH + GAP),
            matrixTop + rowIndex * (CELL_HEIGHT + GAP),
            standardId,
            apcaTypography,
          ),
        ),
      )
      .join(""),
    "</svg>",
  ].join("");

  return {
    markup,
    width,
    height,
  };
}

export async function copySvgToClipboard(svgMarkup: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("Clipboard access is not available in this browser.");
  }

  const textBlob = new Blob([svgMarkup], {
    type: "text/plain",
  });

  if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
    try {
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml",
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/svg+xml": svgBlob,
          "text/plain": textBlob,
        }),
      ]);

      return "rich";
    } catch {
      // Fall through to text clipboard for browsers without full SVG item support.
    }
  }

  await navigator.clipboard.writeText(svgMarkup);
  return "text";
}
