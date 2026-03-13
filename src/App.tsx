import { useEffect, useEffectEvent, useReducer, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { ContrastMatrix } from "@/components/ContrastMatrix";
import { PaletteEditor } from "@/components/PaletteEditor";
import { PaletteImportDialog } from "@/components/PaletteImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  APCA_FONT_WEIGHT_OPTIONS,
  clampApcaFontSize,
  contrastStandards,
  getApcaTypographySummary,
  getContrastStandard,
  parseApcaFontWeight,
} from "@/lib/contrastStandards";
import { createInitialAppState, reduceAppState } from "@/lib/appState";
import { updateFavicon } from "@/lib/favicon";
import { buildContrastMatrixSvg, copySvgToClipboard } from "@/lib/matrixSvg";
import { parsePersistedStateFromSearch, stringifyPersistedState } from "@/lib/queryString";
import type {
  AppState,
  ApcaTypographySettings,
  ContrastStandardId,
  PaletteEntry,
} from "@/types";

function createInitialState(): AppState {
  const { palette: serializedPalette } = parsePersistedStateFromSearch();
  return createInitialAppState(serializedPalette);
}

function AccessibilityRulesPanel({
  apcaTypography,
  contrastStandard,
  contrastStandardId,
  isApca,
  onApcaTypographyChange,
  onContrastStandardIdChange,
}: {
  apcaTypography: ApcaTypographySettings;
  contrastStandard: ReturnType<typeof getContrastStandard>;
  contrastStandardId: ContrastStandardId;
  isApca: boolean;
  onApcaTypographyChange: (
    updater: (current: ApcaTypographySettings) => ApcaTypographySettings,
  ) => void;
  onContrastStandardIdChange: (value: ContrastStandardId) => void;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3.5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-1">
            <p className="text-[0.7rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Accessibility rules
            </p>
            <h3 className="text-sm font-medium text-foreground">
              Change the scoring model without changing the palette.
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              The matrix below updates immediately as you switch standards or tune
              APCA typography.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{contrastStandard.label}</Badge>
            {isApca ? (
              <Badge variant="outline">
                {getApcaTypographySummary(apcaTypography)}
              </Badge>
            ) : null}
          </div>
        </div>

        <FieldGroup className="gap-3">
          <FieldSet>
            <FieldLegend variant="label">Contrast standard</FieldLegend>
            <FieldDescription>
              Choose how every text and background pairing is scored.
            </FieldDescription>
            <ToggleGroup
              className="w-full flex-wrap"
              onValueChange={(value) => {
                if (value) {
                  onContrastStandardIdChange(value as ContrastStandardId);
                }
              }}
              size="sm"
              type="single"
              value={contrastStandardId}
              variant="outline"
            >
              {contrastStandards.map((standard) => (
                <ToggleGroupItem
                  aria-label={standard.label}
                  className="flex-1 justify-center"
                  key={standard.id}
                  value={standard.id}
                >
                  {standard.buttonLabel}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>

          {isApca ? (
            <FieldSet>
              <FieldLegend variant="label">APCA typography</FieldLegend>
              <FieldDescription>
                APCA depends on the intended text size and weight, so the pass
                criteria change with these settings.
              </FieldDescription>
              <FieldGroup className="md:grid md:grid-cols-[minmax(0,11rem)_minmax(0,11rem)_minmax(0,1fr)]">
                <Field>
                  <FieldLabel htmlFor="apca-font-size">Font size (px)</FieldLabel>
                  <Input
                    id="apca-font-size"
                    inputMode="numeric"
                    min={8}
                    onChange={(event) =>
                      onApcaTypographyChange((current) => ({
                        ...current,
                        fontSizePx: clampApcaFontSize(
                          Number.parseInt(event.target.value, 10),
                        ),
                      }))
                    }
                    type="number"
                    value={apcaTypography.fontSizePx}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="apca-font-weight">Font weight</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      onApcaTypographyChange((current) => ({
                        ...current,
                        fontWeight: parseApcaFontWeight(value),
                      }))
                    }
                    value={String(apcaTypography.fontWeight)}
                  >
                    <SelectTrigger
                      aria-label="Font weight"
                      className="w-full"
                      id="apca-font-weight"
                    >
                      <SelectValue placeholder="Select weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {APCA_FONT_WEIGHT_OPTIONS.map((weight) => (
                          <SelectItem key={weight} value={String(weight)}>
                            {weight}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="rounded-xl border bg-background px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">
                    Current APCA target
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {getApcaTypographySummary(apcaTypography)}
                  </p>
                </div>
              </FieldGroup>
            </FieldSet>
          ) : (
            <FieldSet>
              <FieldLegend variant="label">Current requirement</FieldLegend>
              <FieldDescription>{contrastStandard.description}</FieldDescription>
            </FieldSet>
          )}
        </FieldGroup>
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reduceAppState, undefined, createInitialState);
  const [contrastStandardId, setContrastStandardId] = useState<ContrastStandardId>(
    () => parsePersistedStateFromSearch().contrastStandardId,
  );
  const [apcaTypography, setApcaTypography] = useState<ApcaTypographySettings>(
    () => parsePersistedStateFromSearch().apcaTypography,
  );
  const contrastStandard = getContrastStandard(contrastStandardId);
  const isApca = contrastStandardId === "apca-body";
  const pairingCount = state.palette.length * state.palette.length;

  useEffect(() => {
    updateFavicon(state.palette.map((entry) => entry.color));
  }, [state.palette]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const queryString = stringifyPersistedState({
      apcaTypography,
      contrastStandardId,
      palette: state.palette,
    });
    const nextUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [apcaTypography, contrastStandardId, state.palette]);

  const handlePopState = useEffectEvent(() => {
    const persistedState = parsePersistedStateFromSearch();

    dispatch({ type: "loadPalette", palette: persistedState.palette });
    setContrastStandardId(persistedState.contrastStandardId);
    setApcaTypography(persistedState.apcaTypography);
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

  const applyImportedPalette = (palette: PaletteEntry[]) => {
    const queryString = stringifyPersistedState({
      apcaTypography,
      contrastStandardId,
      palette,
    });
    const nextUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.pushState({}, "", nextUrl);
    dispatch({ type: "replacePalette", palette });
  };

  const copyMatrixSvg = async () => {
    try {
      const matrixSvg = buildContrastMatrixSvg({
        apcaTypography,
        palette: state.palette,
        standardId: contrastStandardId,
      });
      const copyMode = await copySvgToClipboard(matrixSvg.markup);

      toast.success(
        copyMode === "rich"
          ? "SVG copied to the clipboard."
          : "SVG markup copied to the clipboard.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not copy the SVG to the clipboard.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-[94rem] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Color workspace</Badge>
              <Badge variant="outline">{contrastStandard.label}</Badge>
              {isApca ? (
                <Badge variant="outline">
                  {getApcaTypographySummary(apcaTypography)}
                </Badge>
              ) : null}
            </div>
            <div className="flex max-w-3xl flex-col gap-1.5">
              <CardTitle>Contrast review workspace</CardTitle>
              <CardDescription className="leading-7">
                Build, review, and share accessible color systems in a neutral
                application shell that stays focused on the matrix.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6">
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>Palette</CardTitle>
                  <CardDescription>
                    Curate, adjust, and reorder the swatches you want to evaluate.
                  </CardDescription>
                </div>
                <CardAction>
                  <Badge variant="outline">Live</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <PaletteEditor
                  compact
                  onAdd={() => dispatch({ type: "add" })}
                  onChangeColorText={(id, value) =>
                    dispatch({ type: "changeColorText", id, value })
                  }
                  onChangeName={(id, value) =>
                    dispatch({ type: "changeName", id, value })
                  }
                  onRemove={(id) => dispatch({ type: "remove", id })}
                  onReorder={(activeId, overId) =>
                    dispatch({ type: "reorder", activeId, overId })
                  }
                  palette={state.palette}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                <div className="flex flex-wrap gap-2">
                  <PaletteImportDialog
                    disabled={false}
                    onApply={applyImportedPalette}
                  />
                </div>
              </CardFooter>
            </Card>
          </aside>

          <section className="min-w-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>Contrast matrix</CardTitle>
                  <CardDescription>
                    Foreground colors run across the top, background colors down
                    the side, and dragging a header reorders both axes together.
                  </CardDescription>
                </div>
                <CardAction className="flex flex-wrap gap-2">
                  <Button onClick={() => void copyMatrixSvg()} size="sm" type="button" variant="outline">
                    <Copy data-icon="inline-start" />
                    Copy SVG
                  </Button>
                  <Badge variant="secondary">{contrastStandard.label}</Badge>
                  <Badge variant="outline">{pairingCount} pairings</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <AccessibilityRulesPanel
                  apcaTypography={apcaTypography}
                  contrastStandard={contrastStandard}
                  contrastStandardId={contrastStandardId}
                  isApca={isApca}
                  onApcaTypographyChange={setApcaTypography}
                  onContrastStandardIdChange={setContrastStandardId}
                />
                <ContrastMatrix
                  apcaTypography={apcaTypography}
                  onReorder={(activeId, overId) =>
                    dispatch({ type: "reorder", activeId, overId })
                  }
                  palette={state.palette}
                  standardId={contrastStandardId}
                />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Use the passing cells as viable text and background pairs for
                the current accessibility target.
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
