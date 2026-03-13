import { describe, expect, it } from "vitest";

import { buildContrastMatrixSvg } from "@/lib/matrixSvg";
import type { PaletteEntry } from "@/types";

const palette: PaletteEntry[] = [
  {
    id: 1,
    name: "Onyx",
    color: "#000000",
    editableColor: "000000",
  },
  {
    id: 2,
    name: "Ivory",
    color: "#FFFFFF",
    editableColor: "FFFFFF",
  },
];

describe("buildContrastMatrixSvg", () => {
  it("includes the matrix title and current rule summary", () => {
    const svg = buildContrastMatrixSvg({
      apcaTypography: {
        fontSizePx: 16,
        fontWeight: 400,
      },
      palette,
      standardId: "wcag-aa",
    }).markup;

    expect(svg).toContain("Contrast matrix");
    expect(svg).toContain("WCAG AA");
    expect(svg).toContain("4.5:1");
  });

  it("preserves the palette order in the generated artboard and emits score text", () => {
    const svg = buildContrastMatrixSvg({
      apcaTypography: {
        fontSizePx: 16,
        fontWeight: 400,
      },
      palette,
      standardId: "wcag-aa",
    }).markup;

    expect(svg.indexOf("Onyx")).toBeLessThan(svg.indexOf("Ivory"));
    expect(svg).toContain("21:1");
  });

  it("includes the APCA typography summary when APCA is active", () => {
    const svg = buildContrastMatrixSvg({
      apcaTypography: {
        fontSizePx: 18,
        fontWeight: 700,
      },
      palette,
      standardId: "apca-body",
    }).markup;

    expect(svg).toContain("APCA");
    expect(svg).toContain("18px text at 700 weight");
  });
});
