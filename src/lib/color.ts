const HEX_PATTERN = /^[0-9A-F]{3}([0-9A-F]{3})?$/;

function expandShortHex(hex: string) {
  if (hex.length !== 3) {
    return hex;
  }

  return hex
    .split("")
    .map((character) => character + character)
    .join("");
}

export function normalizeEditableHex(value: string) {
  return value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
}

export function isValidHex(value: string) {
  return HEX_PATTERN.test(value);
}

export function toCssHex(value: string) {
  const normalized = normalizeEditableHex(value);
  if (!isValidHex(normalized)) {
    return null;
  }

  return `#${expandShortHex(normalized)}`;
}

function channelToLinear(channel: number) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function parseCssHex(hex: string) {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const fullHex = expandShortHex(normalized);

  return {
    r: Number.parseInt(fullHex.slice(0, 2), 16),
    g: Number.parseInt(fullHex.slice(2, 4), 16),
    b: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

export function contrastRatio(background: string, foreground: string) {
  const first = parseCssHex(background);
  const second = parseCssHex(foreground);

  const firstLuminance =
    0.2126 * channelToLinear(first.r) +
    0.7152 * channelToLinear(first.g) +
    0.0722 * channelToLinear(first.b);

  const secondLuminance =
    0.2126 * channelToLinear(second.r) +
    0.7152 * channelToLinear(second.g) +
    0.0722 * channelToLinear(second.b);

  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function areColorsIndistinguishable(first: string, second: string) {
  return contrastRatio(first, second) < 1.1;
}

export function formatContrastRatio(ratio: number) {
  if (ratio < 4) {
    return `${ratio.toFixed(1)}:1`;
  }

  if (ratio < 5) {
    return `${ratio.toFixed(2)}:1`;
  }

  return `${ratio.toFixed(0)}:1`;
}
