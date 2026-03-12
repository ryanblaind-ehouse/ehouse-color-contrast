import {
  DEFAULT_APCA_TYPOGRAPHY,
  clampApcaFontSize,
  parseApcaFontWeight,
} from "./contrastStandards";
import type {
  ApcaTypographySettings,
  ContrastStandardId,
  PaletteEntry,
  SerializedPalette,
} from "../types";

const COLOR_NAME_KEY = "n";
const COLOR_VALUE_KEY = "v";
const CONTRAST_STANDARD_KEY = "m";
const APCA_FONT_SIZE_KEY = "fs";
const APCA_FONT_WEIGHT_KEY = "fw";

type PersistedQueryState = {
  apcaTypography: ApcaTypographySettings;
  contrastStandardId: ContrastStandardId;
  palette: SerializedPalette;
};

export function parsePaletteFromSearch(search = window.location.search) {
  const params = new URLSearchParams(search);
  const names = params.getAll(COLOR_NAME_KEY);
  const values = params.getAll(COLOR_VALUE_KEY);
  const count = Math.min(names.length, values.length);
  const pairs: SerializedPalette = [];

  for (let index = 0; index < count; index += 1) {
    pairs.push([names[index], values[index]]);
  }

  return pairs;
}

function parseContrastStandardId(value: string | null): ContrastStandardId {
  if (
    value === "wcag-aa" ||
    value === "wcag-aaa" ||
    value === "wcag-large" ||
    value === "apca-body"
  ) {
    return value;
  }

  return "wcag-aa";
}

export function parsePersistedStateFromSearch(
  search = window.location.search,
): PersistedQueryState {
  const params = new URLSearchParams(search);
  const fontSizeValue = Number.parseInt(params.get(APCA_FONT_SIZE_KEY) ?? "", 10);

  return {
    palette: parsePaletteFromSearch(search),
    contrastStandardId: parseContrastStandardId(
      params.get(CONTRAST_STANDARD_KEY),
    ),
    apcaTypography: {
      fontSizePx: Number.isFinite(fontSizeValue)
        ? clampApcaFontSize(fontSizeValue)
        : DEFAULT_APCA_TYPOGRAPHY.fontSizePx,
      fontWeight: parseApcaFontWeight(params.get(APCA_FONT_WEIGHT_KEY) ?? ""),
    },
  };
}

export function stringifyPersistedState({
  apcaTypography,
  contrastStandardId,
  palette,
}: {
  apcaTypography: ApcaTypographySettings;
  contrastStandardId: ContrastStandardId;
  palette: PaletteEntry[];
}) {
  const params = new URLSearchParams();

  palette.forEach((entry) => {
    params.append(COLOR_NAME_KEY, entry.name);
    params.append(COLOR_VALUE_KEY, entry.editableColor);
  });

  params.set(CONTRAST_STANDARD_KEY, contrastStandardId);
  params.set(APCA_FONT_SIZE_KEY, String(apcaTypography.fontSizePx));
  params.set(APCA_FONT_WEIGHT_KEY, String(apcaTypography.fontWeight));

  return params.toString();
}
