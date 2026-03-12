import type { PaletteEntry, SerializedPalette } from "../types";

const COLOR_NAME_KEY = "n";
const COLOR_VALUE_KEY = "v";

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

export function stringifyPalette(palette: PaletteEntry[]) {
  const params = new URLSearchParams();

  palette.forEach((entry) => {
    params.append(COLOR_NAME_KEY, entry.name);
    params.append(COLOR_VALUE_KEY, entry.editableColor);
  });

  return params.toString();
}
