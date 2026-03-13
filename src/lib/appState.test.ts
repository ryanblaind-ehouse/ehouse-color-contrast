import { describe, expect, it } from "vitest";

import { reduceAppState } from "@/lib/appState";
import type { AppState, PaletteEntry } from "@/types";

function createPalette(idOffset = 0): PaletteEntry[] {
  return [
    {
      id: idOffset + 1,
      name: "Base",
      color: "#111111",
      editableColor: "111111",
    },
    {
      id: idOffset + 2,
      name: "Surface",
      color: "#F5F5F5",
      editableColor: "F5F5F5",
    },
  ];
}

describe("reduceAppState", () => {
  it("replaces the palette when importing a new one", () => {
    const originalPalette = createPalette();
    const replacementPalette = createPalette(10);
    const state: AppState = {
      palette: originalPalette,
    };

    const nextState = reduceAppState(state, {
      type: "replacePalette",
      palette: replacementPalette,
    });

    expect(nextState).toEqual({
      palette: replacementPalette,
    });
  });

  it("applies direct color changes immediately", () => {
    const originalPalette = createPalette();
    const state: AppState = {
      palette: originalPalette,
    };

    const nextState = reduceAppState(state, {
      type: "changeColorText",
      id: 1,
      value: "22AA44",
    });

    expect(nextState.palette[0]?.color).toBe("#22AA44");
  });

  it("applies direct name changes immediately", () => {
    const originalPalette = createPalette();
    const state: AppState = {
      palette: originalPalette,
    };

    const nextState = reduceAppState(state, {
      type: "changeName",
      id: 1,
      value: "Brand primary",
    });

    expect(nextState.palette[0]?.name).toBe("Brand primary");
  });
});
