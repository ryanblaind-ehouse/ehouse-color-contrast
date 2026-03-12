import type { CSSProperties } from "react";

import {
  assessContrast,
  buildFailingText,
  buildPassingText,
  getLegendText,
} from "../lib/contrastStandards";
import { areColorsIndistinguishable } from "../lib/color";
import type { ContrastStandardId, PaletteEntry } from "../types";

const WHITE = "#FFFFFF";

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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
      <use
        href="#usa-matrix-bad-contrast-ratio"
        xlinkHref="#usa-matrix-bad-contrast-ratio"
      />
    </svg>
  );
}

function Legend({ standardId }: { standardId: ContrastStandardId }) {
  return (
    <div className="usa-matrix-legend">
      <BadContrastSvg />
      <p className="usa-sr-invisible" aria-hidden="true">
        {getLegendText(standardId)}
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
  standardId,
}: {
  background: PaletteEntry;
  foreground: PaletteEntry;
  standardId: ContrastStandardId;
}) {
  const assessment = assessContrast(
    standardId,
    foreground.color,
    background.color,
  );

  if (assessment.pass) {
    return (
      <td className="usa-matrix-valid-color-combo">
        <div
          className="usa-matrix-square"
          role="presentation"
          style={backgroundStyle(background)}
          title={buildPassingText(
            standardId,
            background.name,
            foreground.name,
            assessment,
          )}
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
          <small className="contrast-score-label">{assessment.scoreText}</small>
          <span className="usa-sr-only">
            {" "}
            passes because it reaches {assessment.scoreText}.{" "}
            {assessment.requirementText}.
          </span>
        </div>
      </td>
    );
  }

  const description = buildFailingText(
    standardId,
    background.name,
    foreground.name,
    assessment,
  );

  return (
    <td className="usa-matrix-invalid-color-combo">
      <div role="presentation" title={description}>
        <BadContrastSvg className="usa-matrix-square" />
      </div>
      <div className="usa-sr-only">
        {description} {assessment.requirementText}.
      </div>
    </td>
  );
}

export function ContrastMatrix({
  palette,
  standardId,
}: {
  palette: PaletteEntry[];
  standardId: ContrastStandardId;
}) {
  return (
    <div>
      <Symbols />
      <Legend standardId={standardId} />
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
                  standardId={standardId}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
