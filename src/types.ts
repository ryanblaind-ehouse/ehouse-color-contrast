export type SerializedPalette = Array<[string, string]>;

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
