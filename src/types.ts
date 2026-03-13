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

export type PaletteImportSourceKind = "upload" | "url" | "clipboard";

export type PaletteImportTargetCount = 4 | 6 | 8 | 10;

export type PaletteImportStatus = "idle" | "loading" | "ready" | "error";

export type PaletteImportPreviewState = {
  sourceKind: PaletteImportSourceKind | null;
  sourceLabel: string;
  previewUrl: string | null;
  status: PaletteImportStatus;
  targetCount: PaletteImportTargetCount;
  palette: PaletteEntry[];
  errorMessage: string | null;
};

export type MatrixSvgArtifact = {
  markup: string;
  width: number;
  height: number;
};
