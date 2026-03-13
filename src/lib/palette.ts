import type { PaletteEntry, SerializedPalette } from "../types";
import { isValidHex, normalizeEditableHex, toCssHex } from "./color";

const FALLBACK_COLOR = "#FF0000";
const SUGGESTED_COLOR_VALUES = [
  "FF6B6B",
  "F59E0B",
  "A3E635",
  "34D399",
  "22D3EE",
  "60A5FA",
  "818CF8",
  "C084FC",
  "F472B6",
  "FB7185",
  "F97316",
  "94A3B8",
] as const;

export const defaultPalette: SerializedPalette = [
  ["white", "ffffff"],
  ["light", "b3efff"],
  ["bright", "00cfff"],
  ["medium", "046b99"],
  ["dark", "1c304a"],
  ["black", "000000"],
];

export function deserializePalette(serialized: SerializedPalette): PaletteEntry[] {
  return serialized.map(([name, hex], index) => {
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

export function createPaletteEntry(id: number): PaletteEntry {
  const editableColor =
    SUGGESTED_COLOR_VALUES[id % SUGGESTED_COLOR_VALUES.length] ?? "FF0000";

  return {
    id,
    name: `Color ${id + 1}`,
    color: toCssHex(editableColor) ?? FALLBACK_COLOR,
    editableColor,
  };
}

export function reorderPaletteEntries(
  palette: PaletteEntry[],
  activeId: number,
  overId: number,
) {
  if (activeId === overId) {
    return palette;
  }

  const activeIndex = palette.findIndex((entry) => entry.id === activeId);
  const overIndex = palette.findIndex((entry) => entry.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return palette;
  }

  const nextPalette = [...palette];
  const [activeEntry] = nextPalette.splice(activeIndex, 1);
  nextPalette.splice(overIndex, 0, activeEntry);

  return nextPalette;
}
