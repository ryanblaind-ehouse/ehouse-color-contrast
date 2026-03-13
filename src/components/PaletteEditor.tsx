import type { ChangeEvent, CSSProperties } from "react";

import type { PaletteEntry } from "../types";
import { areColorsIndistinguishable, contrastRatio } from "../lib/color";

type PaletteEditorProps = {
  isEditing: boolean;
  palette: PaletteEntry[];
  onAdd: () => void;
  onChangeColorText: (id: number, value: string) => void;
  onChangeName: (id: number, value: string) => void;
  onRemove: (id: number) => void;
};

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const MAX_PALETTE_ENTRIES = 6;

function isOdd(index: number) {
  return index % 2 === 1;
}

function squareStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    backgroundColor: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.boxShadow = "inset 0 0 0 1px #aeb0b5";
  }

  return styles;
}

function handleColorChange(
  event: ChangeEvent<HTMLInputElement>,
  id: number,
  onChangeColorText: (id: number, value: string) => void,
) {
  onChangeColorText(id, event.target.value);
}

export function PaletteEditor({
  isEditing,
  palette,
  onAdd,
  onChangeColorText,
  onChangeName,
  onRemove,
}: PaletteEditorProps) {
  return (
    <ul
      className={[
        "usa-grid-full",
        "usa-color-row",
        "usa-primary-color-section",
        isEditing ? "palette-is-editable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {palette.map((entry, index) => {
        const labelText = `Remove color ${entry.name}`;
        const isLight =
          contrastRatio(entry.color, BLACK) > contrastRatio(entry.color, WHITE);
        const nameId = `color_name_${entry.id}`;
        const valueId = `color_value_${entry.id}`;

        return (
          <li
            className={[
              "usa-color-square",
              isOdd(index) ? "usa-mobile-end-row" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={entry.id}
            style={squareStyle(entry)}
          >
            {palette.length > 1 ? (
              <button
                aria-label={labelText}
                className={[
                  "usa-button-outline-inverse",
                  "palette-action-remove",
                  isLight ? "palette-entry-is-light" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onRemove(entry.id)}
                title={labelText}
                type="button"
              >
                ×
              </button>
            ) : null}

            <div className="usa-color-inner-content">
              <p className="usa-color-name">
                {isEditing ? (
                  <>
                    <input
                      id={nameId}
                      onChange={(event) => onChangeName(entry.id, event.target.value)}
                      type="text"
                      value={entry.name}
                    />
                    <label className="usa-sr-only" htmlFor={nameId}>
                      Color name
                    </label>
                  </>
                ) : (
                  entry.name
                )}
              </p>
              <p className="usa-color-hex">
                {isEditing ? (
                  <>
                    <input
                      id={valueId}
                      onChange={(event) =>
                        handleColorChange(event, entry.id, onChangeColorText)
                      }
                      spellCheck={false}
                      type="text"
                      value={entry.editableColor}
                    />
                    <label className="usa-sr-only" htmlFor={valueId}>
                      Color value (in hexadecimal)
                    </label>
                  </>
                ) : (
                  entry.color.slice(1).toUpperCase()
                )}
              </p>
            </div>
          </li>
        );
      })}

      {palette.length < MAX_PALETTE_ENTRIES ? (
        <li className="usa-color-square palette-action-add-wrapper">
          <button
            aria-label="Add a new color to the matrix"
            className="usa-button-outline"
            onClick={onAdd}
            title="Add a new color to the matrix"
            type="button"
          >
            +
          </button>
        </li>
      ) : null}
    </ul>
  );
}
