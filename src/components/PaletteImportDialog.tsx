import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
} from "react";
import {
  Clipboard,
  Link2,
  LoaderCircle,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PaletteEditor } from "@/components/PaletteEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  removePaletteEntry,
  updatePaletteColorText,
  updatePaletteName,
} from "@/lib/appState";
import {
  createImageSourceFromBlob,
  createImageSourceFromUrl,
  extractPaletteFromImage,
  PALETTE_IMPORT_COUNTS,
  type PreparedPaletteImportSource,
} from "@/lib/paletteImport";
import { reorderPaletteEntries } from "@/lib/palette";
import type {
  PaletteEntry,
  PaletteImportPreviewState,
  PaletteImportSourceKind,
  PaletteImportTargetCount,
} from "@/types";

type PaletteImportDialogProps = {
  disabled?: boolean;
  onApply: (palette: PaletteEntry[]) => void;
};

const DEFAULT_TARGET_COUNT: PaletteImportTargetCount = 6;

const INITIAL_PREVIEW_STATE: PaletteImportPreviewState = {
  sourceKind: null,
  sourceLabel: "",
  previewUrl: null,
  status: "idle",
  targetCount: DEFAULT_TARGET_COUNT,
  palette: [],
  errorMessage: null,
};

function getStatusBadgeVariant(status: PaletteImportPreviewState["status"]) {
  if (status === "ready") {
    return "secondary";
  }

  if (status === "error") {
    return "destructive";
  }

  return "outline";
}

function getStatusText(status: PaletteImportPreviewState["status"]) {
  switch (status) {
    case "loading":
      return "Extracting";
    case "ready":
      return "Ready";
    case "error":
      return "Needs attention";
    default:
      return "Waiting for image";
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while importing that image.";
}

function getClipboardImageFile(
  clipboardData: DataTransfer | null | undefined,
) {
  if (!clipboardData) {
    return null;
  }

  for (const item of Array.from(clipboardData.items)) {
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }

  return null;
}

export function PaletteImportDialog({
  disabled = false,
  onApply,
}: PaletteImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PaletteImportSourceKind>("upload");
  const [preview, setPreview] = useState(INITIAL_PREVIEW_STATE);
  const [urlValue, setUrlValue] = useState("");
  const sourceRef = useRef<PreparedPaletteImportSource | null>(null);
  const requestIdRef = useRef(0);

  const clearSource = useEffectEvent(() => {
    sourceRef.current?.revoke?.();
    sourceRef.current = null;
  });

  const resetDialog = useEffectEvent(() => {
    requestIdRef.current += 1;
    clearSource();
    setPreview((current) => ({
      ...INITIAL_PREVIEW_STATE,
      targetCount: current.targetCount,
    }));
    setActiveTab("upload");
    setUrlValue("");
  });

  const runExtraction = useEffectEvent(async (source: PreparedPaletteImportSource) => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    sourceRef.current = source;

    setPreview((current) => ({
      ...current,
      sourceKind: source.kind,
      sourceLabel: source.sourceLabel,
      previewUrl: source.previewUrl,
      status: "loading",
      palette: [],
      errorMessage: null,
    }));

    try {
      const palette = await extractPaletteFromImage(
        source.previewUrl,
        preview.targetCount,
      );

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setPreview((current) => ({
        ...current,
        sourceKind: source.kind,
        sourceLabel: source.sourceLabel,
        previewUrl: source.previewUrl,
        status: "ready",
        palette,
        errorMessage: null,
      }));
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const message = getErrorMessage(error);

      setPreview((current) => ({
        ...current,
        sourceKind: source.kind,
        sourceLabel: source.sourceLabel,
        previewUrl: source.previewUrl,
        status: "error",
        palette: [],
        errorMessage: message,
      }));
      toast.error(message);
    }
  });

  const loadSource = useEffectEvent(
    async (loader: Promise<PreparedPaletteImportSource>) => {
      try {
        const source = await loader;

        if (sourceRef.current && sourceRef.current.previewUrl !== source.previewUrl) {
          clearSource();
        }

        await runExtraction(source);
      } catch (error) {
        const message = getErrorMessage(error);

        clearSource();
        setPreview((current) => ({
          ...current,
          sourceKind: null,
          sourceLabel: "",
          previewUrl: null,
          status: "error",
          palette: [],
          errorMessage: message,
        }));
        toast.error(message);
      }
    },
  );

  useEffect(() => {
    if (!open || !sourceRef.current) {
      return;
    }

    void runExtraction(sourceRef.current);
  }, [open, preview.targetCount, runExtraction]);

  const handleClipboardImport = useEffectEvent(async (file: File | null) => {
    if (!file) {
      return;
    }

    setActiveTab("clipboard");
    await loadSource(
      createImageSourceFromBlob(file, "clipboard", "Pasted image"),
    );
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onWindowPaste = (event: ClipboardEvent) => {
      const file = getClipboardImageFile(event.clipboardData);

      if (!file) {
        return;
      }

      event.preventDefault();
      void handleClipboardImport(file);
    };

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, [handleClipboardImport, open]);

  useEffect(() => {
    return () => {
      clearSource();
    };
  }, [clearSource]);

  const handleDialogChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetDialog();
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);

    if (!file) {
      return;
    }

    void loadSource(createImageSourceFromBlob(file, "upload", file.name));
    event.target.value = "";
  };

  const handlePasteCapture = (event: ReactClipboardEvent<HTMLDivElement>) => {
    const file = getClipboardImageFile(event.clipboardData);

    if (!file) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    void handleClipboardImport(file);
  };

  const applyPalette = () => {
    onApply(preview.palette);
    toast.success("Palette imported from image.");
    handleDialogChange(false);
  };

  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <Upload data-icon="inline-start" />
        Import palette
      </Button>

      <Dialog onOpenChange={handleDialogChange} open={open}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle>Import a palette from an image</DialogTitle>
            <DialogDescription>
              Extract the most prominent colors from an upload, an image URL, or a
              pasted clipboard image, then review the swatches before replacing the
              current palette.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Extraction target</CardTitle>
                  <CardDescription>
                    Choose how many dominant colors to extract from the image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <FieldSet>
                      <FieldLegend variant="label">Color count</FieldLegend>
                      <ToggleGroup
                        className="w-full flex-wrap"
                        onValueChange={(value) => {
                          if (value) {
                            setPreview((current) => ({
                              ...current,
                              targetCount: Number.parseInt(
                                value,
                                10,
                              ) as PaletteImportTargetCount,
                            }));
                          }
                        }}
                        type="single"
                        value={String(preview.targetCount)}
                        variant="outline"
                      >
                        {PALETTE_IMPORT_COUNTS.map((count) => (
                          <ToggleGroupItem
                            className="flex-1 justify-center"
                            key={count}
                            value={String(count)}
                          >
                            {count}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FieldSet>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Image source</CardTitle>
                  <CardDescription>
                    The import runs completely in your browser and does not upload
                    images anywhere.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs onValueChange={(value) => setActiveTab(value as PaletteImportSourceKind)} value={activeTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="upload">
                        <Upload data-icon="inline-start" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link2 data-icon="inline-start" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="clipboard">
                        <Clipboard data-icon="inline-start" />
                        Paste
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent className="mt-4" value="upload">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="palette-upload">Upload image</FieldLabel>
                          <Input
                            accept="image/*"
                            id="palette-upload"
                            onChange={handleFileUpload}
                            type="file"
                          />
                          <FieldDescription>
                            PNG, JPG, WEBP, GIF, or any other browser-readable image.
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    </TabsContent>

                    <TabsContent className="mt-4" value="url">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="palette-url">Image URL</FieldLabel>
                          <Input
                            id="palette-url"
                            onChange={(event) => setUrlValue(event.target.value)}
                            placeholder="https://example.com/palette-image.png"
                            spellCheck={false}
                            type="url"
                            value={urlValue}
                          />
                          <FieldDescription>
                            Remote images must allow browser CORS requests to be
                            imported successfully.
                          </FieldDescription>
                        </Field>
                        <Alert>
                          <TriangleAlert />
                          <AlertTitle>Browser-only import</AlertTitle>
                          <AlertDescription>
                            If the image host blocks cross-origin requests, the URL
                            import will fail and you can upload the image instead.
                          </AlertDescription>
                        </Alert>
                        <Button
                          disabled={!urlValue.trim() || preview.status === "loading"}
                          onClick={() => void loadSource(createImageSourceFromUrl(urlValue))}
                          type="button"
                        >
                          {preview.status === "loading" && activeTab === "url" ? (
                            <LoaderCircle className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <Link2 data-icon="inline-start" />
                          )}
                          Load image
                        </Button>
                      </FieldGroup>
                    </TabsContent>

                    <TabsContent className="mt-4" value="clipboard">
                      <div
                        className="rounded-xl border border-dashed bg-muted/40 p-4"
                        onPaste={handlePasteCapture}
                        tabIndex={0}
                      >
                        <FieldGroup>
                          <FieldSet>
                            <FieldLegend variant="label">Paste an image</FieldLegend>
                            <FieldDescription>
                              With this dialog open, paste an image from your
                              clipboard and the preview will update automatically.
                            </FieldDescription>
                          </FieldSet>
                          <Alert>
                            <Clipboard />
                            <AlertTitle>Clipboard image only</AlertTitle>
                            <AlertDescription>
                              Text, URLs, and non-image clipboard items are ignored.
                            </AlertDescription>
                          </Alert>
                        </FieldGroup>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card size="sm">
                <CardHeader>
                  <div className="flex flex-col gap-1">
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Review and edit the imported swatches before replacing the
                      current matrix palette.
                    </CardDescription>
                  </div>
                  <CardAction>
                    <Badge variant={getStatusBadgeVariant(preview.status)}>
                      {getStatusText(preview.status)}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {preview.previewUrl ? (
                    <div className="overflow-hidden rounded-xl border bg-muted/30">
                      <img
                        alt={`Import source preview from ${preview.sourceLabel || "image"}`}
                        className="aspect-[16/9] w-full object-cover"
                        src={preview.previewUrl}
                      />
                    </div>
                  ) : (
                    <Alert>
                      <TriangleAlert />
                      <AlertTitle>No image selected yet</AlertTitle>
                      <AlertDescription>
                        Choose an image source on the left to generate a preview
                        palette.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{preview.targetCount} target colors</Badge>
                    {preview.sourceLabel ? (
                      <Badge variant="outline">{preview.sourceLabel}</Badge>
                    ) : null}
                    {preview.palette.length > 0 ? (
                      <Badge variant="secondary">
                        {preview.palette.length} extracted
                      </Badge>
                    ) : null}
                  </div>

                  {preview.errorMessage ? (
                    <Alert variant="destructive">
                      <TriangleAlert />
                      <AlertTitle>Import failed</AlertTitle>
                      <AlertDescription>{preview.errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  {preview.palette.length > 0 ? (
                    <PaletteEditor
                      isEditing
                      onAdd={() => {}}
                      onChangeColorText={(id, value) =>
                        setPreview((current) => ({
                          ...current,
                          palette: updatePaletteColorText(
                            current.palette,
                            id,
                            value,
                          ),
                        }))
                      }
                      onChangeName={(id, value) =>
                        setPreview((current) => ({
                          ...current,
                          palette: updatePaletteName(current.palette, id, value),
                        }))
                      }
                      onRemove={(id) =>
                        setPreview((current) => ({
                          ...current,
                          palette: removePaletteEntry(current.palette, id),
                        }))
                      }
                      onReorder={(activeId, overId) =>
                        setPreview((current) => ({
                          ...current,
                          palette: reorderPaletteEntries(
                            current.palette,
                            activeId,
                            overId,
                          ),
                        }))
                      }
                      palette={preview.palette}
                      showAddCard={false}
                    />
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={preview.status !== "ready" || preview.palette.length === 0}
              onClick={applyPalette}
              type="button"
            >
              Replace palette
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
