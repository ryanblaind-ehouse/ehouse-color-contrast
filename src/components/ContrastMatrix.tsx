import type { CSSProperties } from "react";
import type { PaletteEntry } from "../types";
import {
  areColorsIndistinguishable,
  contrastRatio,
  formatContrastRatio,
} from "../lib/color";

const WHITE = "#FFFFFF";

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function badContrastText(
  background: PaletteEntry,
  foreground: PaletteEntry,
  ratio: number,
) {
  return `Do not use ${foreground.name} text on ${background.name} background; it is not 508-compliant, with a contrast ratio of ${formatContrastRatio(ratio)}.`;
}

function goodContrastText(
  background: PaletteEntry,
  foreground: PaletteEntry,
  ratio: number,
) {
  return `The contrast ratio of ${foreground.name} on ${background.name} is ${formatContrastRatio(ratio)}.`;
}

function Symbols() {
  return (
    <svg className="usa-matrix-symbol-definitions">
      <symbol id="usa-matrix-bad-contrast-ratio" viewBox="0 0 100 100">
        <rect fill="#f0f0f0" height="100" width="100" />
        <line
          stroke="white"
          strokeWidth="4"
          x1="0"
          x2="100"
          y1="100"
          y2="0"
        />
      </symbol>
    </svg>
  );
}

function BadContrastSvg({ className = "" }: { className?: string }) {
  return (
    <svg className={className}>
      <use href="#usa-matrix-bad-contrast-ratio" xlinkHref="#usa-matrix-bad-contrast-ratio" />
    </svg>
  );
}

function Legend() {
  return (
    <div className="usa-matrix-legend">
      <BadContrastSvg />
      <p className="usa-sr-invisible" aria-hidden="true">
        Please don't use these color combinations; they do not meet a color
        contrast ratio of 4.5:1, so they do not conform with the standards of
        Section 508 for body text. This means that some people would have
        difficulty reading the text. Employing accessibility best practices
        improves the user experience for all users.
      </p>
    </div>
  );
}

function foregroundStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    color: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.textShadow =
      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
  }

  return styles;
}

function backgroundStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    backgroundColor: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.boxShadow = "inset 0 0 0 1px #aeb0b5";
  }

  return styles;
}

function MatrixHeaderCell({ entry }: { entry: PaletteEntry }) {
  return (
    <td scope="col">
      <div className="usa-matrix-desc">
        {capitalize(entry.name)} text
        <br />
        <small>{entry.color.slice(1).toUpperCase()}</small>
      </div>
      <strong
        aria-hidden="true"
        className="usa-sr-invisible"
        style={foregroundStyle(entry)}
      >
        Aa
      </strong>
    </td>
  );
}

function MatrixRowHeader({ entry }: { entry: PaletteEntry }) {
  return (
    <td scope="row">
      <div>
        <div className="usa-matrix-square" style={backgroundStyle(entry)} />
        <div className="usa-matrix-desc">
          {capitalize(entry.name)} background
          <br />
          <small>{entry.color.slice(1).toUpperCase()}</small>
        </div>
      </div>
    </td>
  );
}

function MatrixCell({
  background,
  foreground,
}: {
  background: PaletteEntry;
  foreground: PaletteEntry;
}) {
  const ratio = contrastRatio(background.color, foreground.color);

  if (ratio >= 4.5) {
    return (
      <td className="usa-matrix-valid-color-combo">
        <div
          className="usa-matrix-square"
          role="presentation"
          style={backgroundStyle(background)}
          title={goodContrastText(background, foreground, ratio)}
        >
          <strong
            aria-hidden="true"
            className="usa-sr-invisible"
            style={{ color: foreground.color }}
          >
            Aa
          </strong>
        </div>
        <div className="usa-matrix-color-combo-description">
          <strong>{capitalize(foreground.name)}</strong> text on{" "}
          <strong>{capitalize(background.name)}</strong> background
          <span className="usa-sr-only">
            {" "}
            is 508-compliant, with a contrast ratio of {formatContrastRatio(ratio)}.
          </span>
        </div>
      </td>
    );
  }

  const description = badContrastText(background, foreground, ratio);

  return (
    <td className="usa-matrix-invalid-color-combo">
      <div role="presentation" title={description}>
        <BadContrastSvg className="usa-matrix-square" />
      </div>
      <div className="usa-sr-only">{description}</div>
    </td>
  );
}

export function ContrastMatrix({ palette }: { palette: PaletteEntry[] }) {
  return (
    <div>
      <Symbols />
      <Legend />
      <table className="usa-table-borderless usa-matrix">
        <thead>
          <tr>
            <td scope="col" />
            {palette.map((entry) => (
              <MatrixHeaderCell entry={entry} key={entry.id} />
            ))}
          </tr>
        </thead>
        <tbody>
          {[...palette].reverse().map((background) => (
            <tr key={background.id}>
              <MatrixRowHeader entry={background} />
              {palette.map((foreground) => (
                <MatrixCell
                  background={background}
                  foreground={foreground}
                  key={`${background.id}-${foreground.id}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
