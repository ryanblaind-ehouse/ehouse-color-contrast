import { describe, expect, it, vi } from "vitest";

import {
  buildImportedPalette,
  createImageSourceFromUrl,
} from "@/lib/paletteImport";
import type { PaletteImportTargetCount } from "@/types";

describe("buildImportedPalette", () => {
  it("normalizes imported hex values into uppercase palette entries", () => {
    const palette = buildImportedPalette(
      [
        { area: 0.42, hex: "#abc", lightness: 0.3 },
        { area: 0.31, hex: "#112233", lightness: 0.1 },
      ],
      4 as PaletteImportTargetCount,
    );

    expect(palette).toEqual([
      {
        id: 1,
        name: "#112233",
        color: "#112233",
        editableColor: "112233",
      },
      {
        id: 2,
        name: "#AABBCC",
        color: "#AABBCC",
        editableColor: "AABBCC",
      },
    ]);
  });

  it("selects the most prominent colors and sorts the preview from dark to light", () => {
    const palette = buildImportedPalette(
      [
        { area: 0.5, hex: "#ff0000", lightness: 0.5 },
        { area: 0.4, hex: "#111111", lightness: 0.05 },
        { area: 0.3, hex: "#eeeeee", lightness: 0.92 },
        { area: 0.2, hex: "#00ff00", lightness: 0.4 },
        { area: 0.1, hex: "#0000ff", lightness: 0.2 },
      ],
      4 as PaletteImportTargetCount,
    );

    expect(palette.map((entry) => entry.color)).toEqual([
      "#111111",
      "#00FF00",
      "#FF0000",
      "#EEEEEE",
    ]);
  });
});

describe("createImageSourceFromUrl", () => {
  it("rejects invalid URLs before making a request", async () => {
    await expect(createImageSourceFromUrl("not-a-url")).rejects.toThrow(
      "Enter a valid image URL.",
    );
  });

  it("surfaces blocked cross-origin requests with a helpful message", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed"));

    await expect(
      createImageSourceFromUrl("https://example.com/palette.png", {
        fetchImpl,
      }),
    ).rejects.toThrow(
      "The image URL could not be loaded in the browser. The host may block cross-origin requests.",
    );
  });
});
