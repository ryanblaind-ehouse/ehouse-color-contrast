import { normalizeEditableHex, toCssHex } from "./color";
import {
  createPaletteEntry,
  getPaletteOrDefault,
  nextPaletteEntryId,
  reorderPaletteEntries,
} from "./palette";
import type { AppState, PaletteEntry, SerializedPalette } from "../types";

export type AppAction =
  | { type: "add" }
  | { type: "changeColorText"; id: number; value: string }
  | { type: "changeName"; id: number; value: string }
  | { type: "loadPalette"; palette: SerializedPalette }
  | { type: "remove"; id: number }
  | { type: "reorder"; activeId: number; overId: number }
  | { type: "replacePalette"; palette: PaletteEntry[] };

const FALLBACK_COLOR = "#FF0000";

export function createInitialAppState(serializedPalette: SerializedPalette): AppState {
  const palette = getPaletteOrDefault(serializedPalette);

  return {
    palette,
  };
}

function updatePaletteEntry(
  palette: PaletteEntry[],
  id: number,
  updater: (entry: PaletteEntry) => PaletteEntry,
) {
  return palette.map((entry) => (entry.id === id ? updater(entry) : entry));
}

function entryFallbackColor(palette: PaletteEntry[], id: number) {
  return palette.find((entry) => entry.id === id)?.color ?? FALLBACK_COLOR;
}

export function updatePaletteName(palette: PaletteEntry[], id: number, value: string) {
  return updatePaletteEntry(palette, id, (entry) => ({
    ...entry,
    name: value,
  }));
}

export function updatePaletteColorText(
  palette: PaletteEntry[],
  id: number,
  value: string,
) {
  const editableColor = normalizeEditableHex(value);

  return updatePaletteEntry(palette, id, (entry) => ({
    ...entry,
    editableColor,
    color: toCssHex(editableColor) ?? entryFallbackColor(palette, id),
  }));
}

export function removePaletteEntry(palette: PaletteEntry[], id: number) {
  return palette.filter((entry) => entry.id !== id);
}

export function reduceAppState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "changeName":
      return {
        ...state,
        palette: updatePaletteName(state.palette, action.id, action.value),
      };

    case "changeColorText":
      return {
        ...state,
        palette: updatePaletteColorText(state.palette, action.id, action.value),
      };

    case "remove": {
      const palette = removePaletteEntry(state.palette, action.id);

      return {
        ...state,
        palette,
      };
    }

    case "add": {
      const nextId = nextPaletteEntryId(state.palette);
      const palette = [...state.palette, createPaletteEntry(nextId)];

      return {
        ...state,
        palette,
      };
    }

    case "reorder": {
      const palette = reorderPaletteEntries(
        state.palette,
        action.activeId,
        action.overId,
      );

      return {
        ...state,
        palette,
      };
    }

    case "loadPalette": {
      const palette = getPaletteOrDefault(action.palette);

      return {
        palette,
      };
    }

    case "replacePalette":
      return {
        palette: action.palette,
      };

    default:
      return state;
  }
}
