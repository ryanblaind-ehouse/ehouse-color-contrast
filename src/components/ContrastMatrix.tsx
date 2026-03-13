import { Fragment, useState, type CSSProperties, type DragEvent } from "react";
import { CircleOff, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
const MATRIX_ROW_HEADER_WIDTH_CLASS = "w-[14rem]";
const MATRIX_CELL_WIDTH_CLASS = "w-[12.5rem]";
const MATRIX_ROW_HEADER_WIDTH_PX = 224;
const MATRIX_CELL_WIDTH_PX = 200;

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

function buildGridTemplate(columnCount: number) {
  return `${MATRIX_ROW_HEADER_WIDTH_PX}px repeat(${columnCount}, ${MATRIX_CELL_WIDTH_PX}px)`;
}

function HeaderSwatch({ entry }: { entry: PaletteEntry }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-lg border border-border/70 bg-card">
      <span className="text-sm font-semibold" style={foregroundStyle(entry)}>
        Aa
      </span>
    </div>
  );
}

function CornerPlaceholder() {
  return (
    <div
      className={cn(
        "sticky left-0 z-20 rounded-lg border border-dashed bg-background",
        MATRIX_ROW_HEADER_WIDTH_CLASS,
      )}
      aria-hidden="true"
    >
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
    <div
      className={cn(
        "flex cursor-grab flex-col gap-3 rounded-lg border bg-background px-3 py-3 transition-colors active:cursor-grabbing",
        MATRIX_CELL_WIDTH_CLASS,
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
      <div className="flex items-start justify-between gap-3">
        <HeaderSwatch entry={entry} />
        <GripVertical className="shrink-0 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">
          {capitalize(entry.name)}
        </span>
        <span className="truncate text-xs leading-5 text-muted-foreground">
          Text · {entry.color}
        </span>
      </div>
    </div>
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
    <div
      className={cn(
        "sticky left-0 z-10 flex cursor-grab flex-col gap-3 rounded-lg border bg-background px-3 py-3 transition-colors active:cursor-grabbing",
        MATRIX_ROW_HEADER_WIDTH_CLASS,
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
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "size-11 shrink-0 rounded-lg border border-border/70",
            areColorsIndistinguishable(entry.color, WHITE)
              ? "bg-card"
              : "bg-transparent",
          )}
          style={backgroundStyle(entry)}
        />
        <GripVertical className="shrink-0 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">
          {capitalize(entry.name)}
        </span>
        <span className="truncate text-xs leading-5 text-muted-foreground">
          Background · {entry.color}
        </span>
      </div>
    </div>
  );
}

function PassingCell({
  assessmentText,
  background,
  foreground,
  requirementText,
  scoreText,
}: {
  assessmentText: string;
  background: PaletteEntry;
  foreground: PaletteEntry;
  requirementText: string;
  scoreText: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-background px-3 py-3",
        MATRIX_CELL_WIDTH_CLASS,
      )}
      title={assessmentText}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-lg border border-border/70",
            areColorsIndistinguishable(background.color, WHITE)
              ? "bg-card"
              : "bg-transparent",
          )}
          style={backgroundStyle(background)}
        >
          <span className="text-sm font-semibold" style={foregroundStyle(foreground)}>
            Aa
          </span>
        </div>
        <Badge className="shrink-0" variant="secondary">
          {scoreText}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">
          {capitalize(foreground.name)}
        </span>{" "}
        on{" "}
        <span className="font-medium text-foreground">
          {capitalize(background.name)}
        </span>
      </p>
      <span className="sr-only">
        {assessmentText} {requirementText}.
      </span>
    </div>
  );
}

function FailingCell({
  description,
  requirementText,
  background,
  foreground,
  scoreText,
}: {
  description: string;
  requirementText: string;
  background: PaletteEntry;
  foreground: PaletteEntry;
  scoreText: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed bg-muted/35 px-3 py-3 text-muted-foreground",
        MATRIX_CELL_WIDTH_CLASS,
      )}
      title={description}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg border border-dashed border-border bg-background">
          <CircleOff />
        </div>
        <Badge className="shrink-0" variant="outline">
          {scoreText}
        </Badge>
      </div>
      <p className="text-sm leading-6">
        <span className="font-medium text-foreground">
          {capitalize(foreground.name)}
        </span>{" "}
        on{" "}
        <span className="font-medium text-foreground">
          {capitalize(background.name)}
        </span>
      </p>
      <span className="sr-only">
        {description} {requirementText}.
      </span>
    </div>
  );
}

function MatrixCell({
  apcaTypography,
  background,
  foreground,
  standardId,
}: {
  apcaTypography: ApcaTypographySettings;
  background: PaletteEntry;
  foreground: PaletteEntry;
  standardId: ContrastStandardId;
}) {
  const assessment = assessContrast(
    standardId,
    foreground.color,
    background.color,
    apcaTypography,
  );

  if (assessment.pass) {
    return (
      <PassingCell
        assessmentText={buildPassingText(
          standardId,
          background.name,
          foreground.name,
          assessment,
        )}
        background={background}
        foreground={foreground}
        requirementText={assessment.requirementText}
        scoreText={assessment.scoreText}
      />
    );
  }

  return (
    <FailingCell
      background={background}
      description={buildFailingText(
        standardId,
        background.name,
        foreground.name,
        assessment,
      )}
      foreground={foreground}
      requirementText={assessment.requirementText}
      scoreText={assessment.scoreText}
    />
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
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border bg-muted/20 p-2">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: buildGridTemplate(palette.length),
            width: "max-content",
          }}
        >
          <CornerPlaceholder />
          {palette.map((entry) => (
            <MatrixHeaderCell
              activeDragId={activeDragId}
              dropTargetId={dropTargetId}
              entry={entry}
              key={`column-${entry.id}`}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onStartDrag={handleDragStart}
            />
          ))}

          {palette.map((background) => (
            <Fragment key={`row-${background.id}`}>
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
            </Fragment>
          ))}
        </div>
      </div>
      <p className="px-1 text-sm leading-5 text-muted-foreground">
        {getLegendText(standardId, apcaTypography)}
      </p>
    </div>
  );
}
