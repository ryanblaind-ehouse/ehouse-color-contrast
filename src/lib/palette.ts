import type { PaletteEntry, SerializedPalette } from "../types";
import { isValidHex, normalizeEditableHex, toCssHex } from "./color";

export const MAX_PALETTE_ENTRIES = 6;

const FALLBACK_COLOR = "#FF0000";

export const defaultPalette: SerializedPalette = [
  ["white", "ffffff"],
  ["light", "b3efff"],
  ["bright", "00cfff"],
  ["medium", "046b99"],
  ["dark", "1c304a"],
  ["black", "000000"],
];

export function deserializePalette(serialized: SerializedPalette): PaletteEntry[] {
  return serialized.slice(0, MAX_PALETTE_ENTRIES).map(([name, hex], index) => {
    const editableColor = normalizeEditableHex(hex);
    const cssHex = toCssHex(editableColor) ?? FALLBACK_COLOR;

    return {
      id: index,
      name,
      color: cssHex,
      editableColor,
    };
  });
}

export function serializePalette(palette: PaletteEntry[]): SerializedPalette {
  return palette.map((entry) => [entry.name, entry.editableColor]);
}

export function getPaletteOrDefault(serialized: SerializedPalette) {
  if (serialized.length === 0) {
    return deserializePalette(defaultPalette);
  }

  return deserializePalette(serialized);
}

export function isPaletteValid(palette: PaletteEntry[]) {
  return palette.every((entry) => isValidHex(entry.editableColor));
}

export function nextPaletteEntryId(palette: PaletteEntry[]) {
  return palette.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
}
