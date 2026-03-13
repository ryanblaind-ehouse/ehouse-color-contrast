import { useState, type CSSProperties, type DragEvent } from "react";
import { CircleOff, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  assessContrast,
  buildFailingText,
  buildPassingText,
  getLegendText,
} from "@/lib/contrastStandards";
import { areColorsIndistinguishable } from "@/lib/color";
import type {
  ApcaTypographySettings,
  ContrastStandardId,
  PaletteEntry,
} from "@/types";

const WHITE = "#FFFFFF";
const DRAG_DATA_KEY = "application/x-ehouse-color-id";

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function foregroundStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    color: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.textShadow =
      "-1px -1px 0 rgb(0 0 0 / 0.25), 1px -1px 0 rgb(0 0 0 / 0.25), -1px 1px 0 rgb(0 0 0 / 0.25), 1px 1px 0 rgb(0 0 0 / 0.25)";
  }

  return styles;
}

function backgroundStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    backgroundColor: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.boxShadow = "inset 0 0 0 1px var(--color-border)";
  }

  return styles;
}

function HeaderSwatch({ entry }: { entry: PaletteEntry }) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-lg border border-border/70",
        areColorsIndistinguishable(entry.color, WHITE) ? "bg-card" : "bg-transparent",
      )}
      style={backgroundStyle(entry)}
    >
      <span className="text-sm font-semibold" style={foregroundStyle(entry)}>
        Aa
      </span>
    </div>
  );
}

function MatrixHeaderCell({
  activeDragId,
  dropTargetId,
  entry,
  onDragEnd,
  onDragOver,
  onDrop,
  onStartDrag,
}: {
  activeDragId: number | null;
  dropTargetId: number | null;
  entry: PaletteEntry;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, id: number) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: number) => void;
  onStartDrag: (event: DragEvent<HTMLElement>, id: number) => void;
}) {
  return (
    <TableHead className="sticky top-6 z-20 h-auto border-none bg-muted/20 p-0 align-bottom">
      <div
        className={cn(
          "flex min-w-36 cursor-grab flex-col gap-3 rounded-lg border bg-background p-3 transition-colors active:cursor-grabbing",
          activeDragId === entry.id && "opacity-60",
          dropTargetId === entry.id && "ring-2 ring-primary/20",
        )}
        draggable
        onDragEnd={onDragEnd}
        onDragOver={(event) => onDragOver(event, entry.id)}
        onDrop={(event) => onDrop(event, entry.id)}
        onDragStart={(event) => onStartDrag(event, entry.id)}
        title={`Drag to reorder ${entry.name}`}
      >
        <div className="flex items-center justify-between gap-2">
          <HeaderSwatch entry={entry} />
          <GripVertical className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {capitalize(entry.name)}
          </span>
          <span className="text-xs text-muted-foreground">
            Text · {entry.color}
          </span>
        </div>
      </div>
    </TableHead>
  );
}

function MatrixRowHeader({
  activeDragId,
  dropTargetId,
  entry,
  onDragEnd,
  onDragOver,
  onDrop,
  onStartDrag,
}: {
  activeDragId: number | null;
  dropTargetId: number | null;
  entry: PaletteEntry;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, id: number) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: number) => void;
  onStartDrag: (event: DragEvent<HTMLElement>, id: number) => void;
}) {
  return (
    <th
      className="sticky left-0 z-10 w-44 min-w-44 bg-muted/20 p-0 text-left align-top"
      scope="row"
    >
      <div
        className={cn(
          "flex min-w-44 cursor-grab items-center gap-3 rounded-lg border bg-background p-3 transition-colors active:cursor-grabbing",
          activeDragId === entry.id && "opacity-60",
          dropTargetId === entry.id && "ring-2 ring-primary/20",
        )}
        draggable
        onDragEnd={onDragEnd}
        onDragOver={(event) => onDragOver(event, entry.id)}
        onDrop={(event) => onDrop(event, entry.id)}
        onDragStart={(event) => onStartDrag(event, entry.id)}
        title={`Drag to reorder ${entry.name}`}
      >
        <div
          className={cn(
            "size-12 shrink-0 rounded-lg border border-border/70",
            areColorsIndistinguishable(entry.color, WHITE) ? "bg-card" : "bg-transparent",
          )}
          style={backgroundStyle(entry)}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {capitalize(entry.name)}
          </span>
          <span className="text-xs text-muted-foreground">
            Background · {entry.color}
          </span>
        </div>
        <GripVertical className="shrink-0 text-muted-foreground" />
      </div>
    </th>
  );
}

function MatrixCell({
  background,
  foreground,
  standardId,
  apcaTypography,
}: {
  background: PaletteEntry;
  foreground: PaletteEntry;
  standardId: ContrastStandardId;
  apcaTypography: ApcaTypographySettings;
}) {
  const assessment = assessContrast(
    standardId,
    foreground.color,
    background.color,
    apcaTypography,
  );

  if (assessment.pass) {
    return (
      <TableCell className="border-none p-0 align-top">
        <div
          className="flex min-w-40 flex-col gap-3 rounded-lg border bg-background p-3"
          title={buildPassingText(
            standardId,
            background.name,
            foreground.name,
            assessment,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-lg border border-border/70",
                areColorsIndistinguishable(background.color, WHITE)
                  ? "bg-card"
                  : "bg-transparent",
              )}
              style={backgroundStyle(background)}
            >
              <span className="text-base font-semibold" style={foregroundStyle(foreground)}>
                Aa
              </span>
            </div>
            <Badge variant="secondary">{assessment.scoreText}</Badge>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">
              {capitalize(foreground.name)}
            </span>{" "}
            on{" "}
            <span className="font-medium text-foreground">
              {capitalize(background.name)}
            </span>
          </p>
          <span className="sr-only">
            {buildPassingText(
              standardId,
              background.name,
              foreground.name,
              assessment,
            )}{" "}
            {assessment.requirementText}.
          </span>
        </div>
      </TableCell>
    );
  }

  const description = buildFailingText(
    standardId,
    background.name,
    foreground.name,
    assessment,
  );

  return (
    <TableCell className="border-none p-0 align-top">
      <div
        className="flex min-w-40 flex-col gap-3 rounded-lg border border-dashed bg-muted/35 p-3 text-muted-foreground"
        title={description}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border bg-background">
            <CircleOff />
          </div>
          <Badge variant="outline">{assessment.scoreText}</Badge>
        </div>
        <p className="text-xs leading-5">
          <span className="font-medium text-foreground">
            {capitalize(foreground.name)}
          </span>{" "}
          on{" "}
          <span className="font-medium text-foreground">
            {capitalize(background.name)}
          </span>
        </p>
        <span className="sr-only">
          {description} {assessment.requirementText}.
        </span>
      </div>
    </TableCell>
  );
}

export function ContrastMatrix({
  apcaTypography,
  onReorder,
  palette,
  standardId,
}: {
  apcaTypography: ApcaTypographySettings;
  onReorder: (activeId: number, overId: number) => void;
  palette: PaletteEntry[];
  standardId: ContrastStandardId;
}) {
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const handleDragStart = (event: DragEvent<HTMLElement>, id: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_DATA_KEY, String(id));
    setActiveDragId(id);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, id: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (activeDragId !== id) {
      setDropTargetId(id);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>, overId: number) => {
    event.preventDefault();
    const activeId = Number.parseInt(event.dataTransfer.getData(DRAG_DATA_KEY), 10);

    setActiveDragId(null);
    setDropTargetId(null);

    if (Number.isFinite(activeId)) {
      onReorder(activeId, overId);
    }
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setDropTargetId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">Preview cells pass</Badge>
        <Badge variant="outline">Muted cells fail</Badge>
        <Badge variant="outline">Drag headers to reorder</Badge>
        <Badge variant="outline">Sticky headers stay visible</Badge>
      </div>
      <div className="rounded-xl border bg-muted/20 p-2 sm:p-3">
        <Table className="min-w-[58rem] border-separate border-spacing-2">
          <TableCaption className="px-2 pb-1 text-left leading-6">
            {getLegendText(standardId, apcaTypography)}
          </TableCaption>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="sticky top-6 left-0 z-30 w-44 min-w-44 bg-muted/20 p-0" />
              {palette.map((entry) => (
                <MatrixHeaderCell
                  activeDragId={activeDragId}
                  dropTargetId={dropTargetId}
                  entry={entry}
                  key={entry.id}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onStartDrag={handleDragStart}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {palette.map((background) => (
              <TableRow className="border-none hover:bg-transparent" key={background.id}>
                <MatrixRowHeader
                  activeDragId={activeDragId}
                  dropTargetId={dropTargetId}
                  entry={background}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onStartDrag={handleDragStart}
                />
                {palette.map((foreground) => (
                  <MatrixCell
                    apcaTypography={apcaTypography}
                    background={background}
                    foreground={foreground}
                    key={`${background.id}-${foreground.id}`}
                    standardId={standardId}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
