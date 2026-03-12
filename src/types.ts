export type SerializedPalette = Array<[string, string]>;

export type ContrastStandardId =
  | "wcag-aa"
  | "wcag-aaa"
  | "wcag-large"
  | "apca-body";

export type FontWeightOption =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;

export type ApcaTypographySettings = {
  fontSizePx: number;
  fontWeight: FontWeightOption;
};

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
