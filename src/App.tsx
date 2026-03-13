import { useEffect, useEffectEvent, useReducer, useState } from "react";
import { Copy, PencilLine, Save, X } from "lucide-react";
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
  FieldSeparator,
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
import { Separator } from "@/components/ui/separator";
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
import { isPaletteValid } from "@/lib/palette";
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

function WorkspaceMetric({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background px-3 py-3">
      <p className="text-[0.7rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
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
  const canSave = isPaletteValid(state.palette);
  const contrastStandard = getContrastStandard(contrastStandardId);
  const isApca = contrastStandardId === "apca-body";
  const pairingCount = state.palette.length * state.palette.length;
  const shareStateLabel = state.isEditing ? "Unsaved edits" : "Share-ready";
  const shareStateDescription = state.isEditing
    ? "Save the palette to push the current swatches into the URL."
    : "The current URL already reflects the saved palette and scoring mode.";

  useEffect(() => {
    updateFavicon(state.lastSavedPalette.map((entry) => entry.color));
  }, [state.lastSavedPalette]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const queryString = stringifyPersistedState({
      apcaTypography,
      contrastStandardId,
      palette: state.lastSavedPalette,
    });
    const nextUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [apcaTypography, contrastStandardId, state.lastSavedPalette]);

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

    const queryString = stringifyPersistedState({
      apcaTypography,
      contrastStandardId,
      palette: state.palette,
    });
    const nextUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.pushState({}, "", nextUrl);
    dispatch({ type: "finishEditing" });
  };

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
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Color workspace</Badge>
                  <Badge variant="outline">{contrastStandard.label}</Badge>
                  {isApca ? (
                    <Badge variant="outline">
                      {getApcaTypographySummary(apcaTypography)}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle>Contrast review workspace</CardTitle>
                  <CardDescription className="max-w-2xl leading-7">
                    Build, review, and share accessible color systems in a
                    neutral application shell that stays focused on the matrix.
                  </CardDescription>
                </div>
              </div>

              <div className="rounded-xl border bg-background px-4 py-3 lg:max-w-sm">
                <p className="text-sm font-medium text-foreground">{shareStateLabel}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {shareStateDescription}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <WorkspaceMetric
                description="Add, remove, and name the swatches you want to evaluate."
                label="Palette"
                value={`${state.palette.length} swatches`}
              />
              <WorkspaceMetric
                description={`Every foreground and background pairing is scored using ${contrastStandard.label}.`}
                label="Coverage"
                value={`${pairingCount} pairings`}
              />
              <WorkspaceMetric
                description={
                  isApca
                    ? getApcaTypographySummary(apcaTypography)
                    : contrastStandard.description
                }
                label="Evaluation"
                value={contrastStandard.label}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-[23rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>Palette</CardTitle>
                  <CardDescription>
                    Curate the swatches you want to evaluate. Color changes update
                    the live matrix immediately, and drag-and-drop changes the
                    matrix order.
                  </CardDescription>
                </div>
                <CardAction>
                  <Badge variant={state.isEditing ? "secondary" : "outline"}>
                    {state.isEditing ? "Editing" : "Saved"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
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
                  onReorder={(activeId, overId) =>
                    dispatch({ type: "reorder", activeId, overId })
                  }
                  palette={state.palette}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {state.isEditing
                    ? "Save when you want the current palette to become the shared URL state."
                    : "Open edit mode to rename swatches or adjust the stored hex values."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.isEditing ? (
                    <>
                      <Button disabled={!canSave} onClick={savePalette} type="button">
                        <Save data-icon="inline-start" />
                        Save changes
                      </Button>
                      <Button
                        onClick={() => dispatch({ type: "cancelEditing" })}
                        type="button"
                        variant="outline"
                      >
                        <X data-icon="inline-start" />
                        Cancel
                      </Button>
                      <PaletteImportDialog
                        disabled
                        onApply={applyImportedPalette}
                      />
                    </>
                  ) : (
                    <>
                      <Button onClick={savePalette} type="button">
                        <PencilLine data-icon="inline-start" />
                        Edit palette
                      </Button>
                      <PaletteImportDialog
                        disabled={state.isEditing}
                        onApply={applyImportedPalette}
                      />
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>

            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>Accessibility rules</CardTitle>
                  <CardDescription>
                    Switch evaluation models without changing the palette.
                  </CardDescription>
                </div>
                <CardAction>
                  <Badge>{contrastStandard.label}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend variant="label">Contrast standard</FieldLegend>
                    <FieldDescription>
                      Choose how every text and background pairing is scored.
                    </FieldDescription>
                    <ToggleGroup
                      className="w-full flex-wrap"
                      onValueChange={(value) => {
                        if (value) {
                          setContrastStandardId(value as ContrastStandardId);
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

                  <FieldSeparator />

                  {isApca ? (
                    <FieldSet>
                      <FieldLegend>APCA typography</FieldLegend>
                      <FieldDescription>
                        APCA depends on the intended text size and weight, so the
                        pass criteria change with these settings.
                      </FieldDescription>
                      <FieldGroup className="sm:grid sm:grid-cols-2 lg:grid-cols-1">
                        <Field>
                          <FieldLabel htmlFor="apca-font-size">Font size (px)</FieldLabel>
                          <Input
                            id="apca-font-size"
                            inputMode="numeric"
                            min={8}
                            onChange={(event) =>
                              setApcaTypography((current) => ({
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
                              setApcaTypography((current) => ({
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
                      </FieldGroup>
                      <div className="rounded-xl border bg-muted/40 px-3 py-3">
                        <p className="text-sm font-medium text-foreground">
                          Current APCA target
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {getApcaTypographySummary(apcaTypography)}
                        </p>
                      </div>
                    </FieldSet>
                  ) : (
                    <FieldSet>
                      <FieldLegend variant="label">Current requirement</FieldLegend>
                      <FieldDescription>
                        {contrastStandard.description}
                      </FieldDescription>
                    </FieldSet>
                  )}
                </FieldGroup>
              </CardContent>
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
              <CardContent className="flex flex-col gap-5">
                <div className="grid gap-3 xl:grid-cols-3">
                  <WorkspaceMetric
                    description="Text colors are compared left-to-right against every background in the matrix."
                    label="Layout"
                    value="Text on top, backgrounds on the left"
                  />
                  <WorkspaceMetric
                    description={
                      isApca
                        ? getApcaTypographySummary(apcaTypography)
                        : contrastStandard.description
                    }
                    label="Requirement"
                    value={contrastStandard.label}
                  />
                  <WorkspaceMetric
                    description={shareStateDescription}
                    label="Share state"
                    value={shareStateLabel}
                  />
                </div>
                <Separator />
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
