export type SerializedPalette = Array<[string, string]>;

export type ContrastStandardId =
  | "wcag-aa"
  | "wcag-aaa"
  | "wcag-large"
  | "apca-body";

export type PaletteEntry = {
  id: number;
  name: string;
  color: string;
  editableColor: string;
};

export type AppState = {
  palette: PaletteEntry[];
  isEditing: boolean;
  lastSavedPalette: PaletteEntry[];
};
