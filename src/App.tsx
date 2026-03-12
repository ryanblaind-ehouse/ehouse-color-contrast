import { useEffect, useEffectEvent, useReducer } from "react";

import { ContrastMatrix } from "./components/ContrastMatrix";
import { PaletteEditor } from "./components/PaletteEditor";
import { updateFavicon } from "./lib/favicon";
import {
  getPaletteOrDefault,
  isPaletteValid,
  nextPaletteEntryId,
} from "./lib/palette";
import { normalizeEditableHex, toCssHex } from "./lib/color";
import { parsePaletteFromSearch, stringifyPalette } from "./lib/queryString";
import type { AppState, PaletteEntry, SerializedPalette } from "./types";

type Action =
  | { type: "add" }
  | { type: "cancelEditing" }
  | { type: "changeColorPicker"; id: number; value: string }
  | { type: "changeColorText"; id: number; value: string }
  | { type: "changeName"; id: number; value: string }
  | { type: "finishEditing" }
  | { type: "loadPalette"; palette: SerializedPalette }
  | { type: "remove"; id: number }
  | { type: "startEditing" };

function createInitialState(): AppState {
  const palette = getPaletteOrDefault(parsePaletteFromSearch());

  return {
    palette,
    isEditing: false,
    lastSavedPalette: palette,
  };
}

function updatePaletteEntry(
  palette: PaletteEntry[],
  id: number,
  updater: (entry: PaletteEntry) => PaletteEntry,
) {
  return palette.map((entry) => (entry.id === id ? updater(entry) : entry));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "changeName":
      return {
        ...state,
        palette: updatePaletteEntry(state.palette, action.id, (entry) => ({
          ...entry,
          name: action.value,
        })),
      };

    case "changeColorText": {
      const editableColor = normalizeEditableHex(action.value);

      return {
        ...state,
        palette: updatePaletteEntry(state.palette, action.id, (entry) => ({
          ...entry,
          editableColor,
          color: toCssHex(editableColor) ?? entry.color,
        })),
      };
    }

    case "changeColorPicker": {
      const editableColor = normalizeEditableHex(action.value);
      const color = toCssHex(editableColor) ?? entryFallbackColor(state.palette, action.id);

      return {
        ...state,
        palette: updatePaletteEntry(state.palette, action.id, (entry) => ({
          ...entry,
          editableColor,
          color,
        })),
      };
    }

    case "remove":
      return {
        ...state,
        palette: state.palette.filter((entry) => entry.id !== action.id),
      };

    case "add": {
      const nextId = nextPaletteEntryId(state.palette);

      return {
        ...state,
        palette: [
          ...state.palette,
          {
            id: nextId,
            name: `Color ${nextId + 1}`,
            color: "#FF0000",
            editableColor: "FF0000",
          },
        ],
      };
    }

    case "loadPalette": {
      const palette = getPaletteOrDefault(action.palette);
      return {
        palette,
        isEditing: false,
        lastSavedPalette: palette,
      };
    }

    case "startEditing":
      return {
        ...state,
        isEditing: true,
        lastSavedPalette: state.palette,
      };

    case "finishEditing":
      return {
        ...state,
        isEditing: false,
        lastSavedPalette: state.palette,
      };

    case "cancelEditing":
      return {
        ...state,
        isEditing: false,
        palette: state.lastSavedPalette,
      };

    default:
      return state;
  }
}

function entryFallbackColor(palette: PaletteEntry[], id: number) {
  return palette.find((entry) => entry.id === id)?.color ?? "#FF0000";
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const canSave = isPaletteValid(state.palette);

  useEffect(() => {
    updateFavicon(state.lastSavedPalette.map((entry) => entry.color));
  }, [state.lastSavedPalette]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const handlePopState = useEffectEvent(() => {
    dispatch({ type: "loadPalette", palette: parsePaletteFromSearch() });
  });

  useEffect(() => {
    const onPopState = () => {
      handlePopState();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [handlePopState]);

  const beginEditing = () => {
    dispatch({ type: "startEditing" });
  };

  const savePalette = () => {
    if (!state.isEditing) {
      beginEditing();
      return;
    }

    if (!canSave) {
      return;
    }

    const queryString = stringifyPalette(state.palette);
    const nextUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.pushState({}, "", nextUrl);
    dispatch({ type: "finishEditing" });
  };

  return (
    <>
      <main>
        <h1>Accessible color palette builder</h1>

        <PaletteEditor
          isEditing={state.isEditing}
          onAdd={() => dispatch({ type: "add" })}
          onChangeColorText={(id, value) =>
            dispatch({ type: "changeColorText", id, value })
          }
          onChangeName={(id, value) =>
            dispatch({ type: "changeName", id, value })
          }
          onRemove={(id) => dispatch({ type: "remove", id })}
          palette={state.palette}
        />

        <div className="usa-grid-full usa-color-row">
          {state.isEditing ? (
            <>
              <button
                className={canSave ? undefined : "usa-button-disabled"}
                disabled={!canSave}
                onClick={savePalette}
                type="button"
              >
                Save changes
              </button>
              <button
                className="usa-button-secondary"
                onClick={() => dispatch({ type: "cancelEditing" })}
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={savePalette} type="button">
              Edit palette
            </button>
          )}
        </div>

        <h2>Accessible color combinations</h2>
        <ContrastMatrix palette={state.palette} />
      </main>

      <footer role="contentinfo">
        <p>
          You can learn more about this project on{" "}
          <a href="https://github.com/ryanblaind-ehouse/ehouse-color-contrast">
            GitHub
          </a>
          .
        </p>
      </footer>
    </>
  );
}
