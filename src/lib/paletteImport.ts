import { extractColors } from "extract-colors";

import { normalizeEditableHex, toCssHex } from "./color";
import type {
  PaletteEntry,
  PaletteImportSourceKind,
  PaletteImportTargetCount,
} from "../types";

export const PALETTE_IMPORT_COUNTS = [4, 6, 8, 10] as const;

export type PreparedPaletteImportSource = {
  kind: PaletteImportSourceKind;
  previewUrl: string;
  sourceLabel: string;
  revoke?: () => void;
};

type ImportRuntime = {
  createObjectUrl: (blob: Blob) => string;
  decodeImageSource: (url: string) => Promise<void>;
  fetchImpl: typeof fetch;
  revokeObjectUrl: (url: string) => void;
};

type ExtractedImportColor = {
  area: number;
  hex: string;
  lightness: number;
};

const defaultRuntime: ImportRuntime = {
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  decodeImageSource,
  fetchImpl: (...args) => fetch(...args),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
};

function getImportRuntime(overrides?: Partial<ImportRuntime>): ImportRuntime {
  return {
    ...defaultRuntime,
    ...overrides,
  };
}

function createImageLabel(
  kind: PaletteImportSourceKind,
  label: string | undefined,
  fallback: string,
) {
  if (label && label.trim()) {
    return label.trim();
  }

  if (kind === "clipboard") {
    return "Pasted image";
  }

  return fallback;
}

function normalizeImportedCssHex(value: string) {
  const normalizedHex = normalizeEditableHex(value.replace(/^#/, ""));
  const cssHex = toCssHex(normalizedHex);

  if (!cssHex) {
    return null;
  }

  return {
    color: cssHex.toUpperCase(),
    editableColor: cssHex.slice(1).toUpperCase(),
  };
}

export function buildImportedPalette(
  colors: ExtractedImportColor[],
  targetCount: PaletteImportTargetCount,
) {
  const selectedColors: Array<{
    area: number;
    color: string;
    editableColor: string;
    lightness: number;
  }> = [];
  const seenColors = new Set<string>();

  for (const color of [...colors].sort((first, second) => second.area - first.area)) {
    const normalized = normalizeImportedCssHex(color.hex);

    if (!normalized || seenColors.has(normalized.color)) {
      continue;
    }

    selectedColors.push({
      area: color.area,
      color: normalized.color,
      editableColor: normalized.editableColor,
      lightness: color.lightness,
    });
    seenColors.add(normalized.color);

    if (selectedColors.length === targetCount) {
      break;
    }
  }

  return selectedColors
    .sort((first, second) => first.lightness - second.lightness)
    .map((color, index) => ({
      id: index + 1,
      name: color.color,
      color: color.color,
      editableColor: color.editableColor,
    } satisfies PaletteEntry));
}

export async function extractPaletteFromImage(
  previewUrl: string,
  targetCount: PaletteImportTargetCount,
) {
  const extractedColors = await extractColors(previewUrl, {
    crossOrigin: "anonymous",
  });
  const palette = buildImportedPalette(extractedColors, targetCount);

  if (palette.length === 0) {
    throw new Error("No usable colors were extracted from that image.");
  }

  return palette;
}

export async function createImageSourceFromBlob(
  blob: Blob,
  kind: PaletteImportSourceKind,
  label?: string,
  runtimeOverrides?: Partial<ImportRuntime>,
) {
  if (!blob.type.startsWith("image/")) {
    throw new Error("Please choose or paste an image file.");
  }

  const runtime = getImportRuntime(runtimeOverrides);
  const previewUrl = runtime.createObjectUrl(blob);

  try {
    await runtime.decodeImageSource(previewUrl);
  } catch {
    runtime.revokeObjectUrl(previewUrl);
    throw new Error("That image could not be decoded in the browser.");
  }

  return {
    kind,
    previewUrl,
    sourceLabel: createImageLabel(kind, label, "Uploaded image"),
    revoke: () => runtime.revokeObjectUrl(previewUrl),
  } satisfies PreparedPaletteImportSource;
}

export async function createImageSourceFromUrl(
  value: string,
  runtimeOverrides?: Partial<ImportRuntime>,
) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid image URL.");
  }

  const runtime = getImportRuntime(runtimeOverrides);
  let response: Response;

  try {
    response = await runtime.fetchImpl(url.toString(), {
      mode: "cors",
    });
  } catch {
    throw new Error(
      "The image URL could not be loaded in the browser. The host may block cross-origin requests.",
    );
  }

  if (!response.ok) {
    throw new Error(`The image request failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("The URL did not return an image.");
  }

  const blob = await response.blob();

  return createImageSourceFromBlob(blob, "url", url.hostname, runtime);
}

async function decodeImageSource(url: string) {
  await new Promise<void>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("The image could not be decoded in the browser."));
    image.src = url;
  });
}
