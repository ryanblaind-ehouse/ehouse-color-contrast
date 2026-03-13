import { useState, type ChangeEvent, type CSSProperties, type DragEvent } from "react";
import { GripVertical, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { areColorsIndistinguishable } from "@/lib/color";
import type { PaletteEntry } from "@/types";

type PaletteEditorProps = {
  isEditing: boolean;
  palette: PaletteEntry[];
  onAdd: () => void;
  onChangeColorText: (id: number, value: string) => void;
  onChangeName: (id: number, value: string) => void;
  onRemove: (id: number) => void;
  onReorder: (activeId: number, overId: number) => void;
  showAddCard?: boolean;
};

const WHITE = "#FFFFFF";
const DRAG_DATA_KEY = "application/x-ehouse-color-id";

function squareStyle(entry: PaletteEntry): CSSProperties {
  const styles: CSSProperties = {
    backgroundColor: entry.color,
  };

  if (areColorsIndistinguishable(entry.color, WHITE)) {
    styles.boxShadow = "inset 0 0 0 1px var(--color-border)";
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

function Swatch({ entry }: { entry: PaletteEntry }) {
  return (
    <div
      className={cn(
        "h-24 rounded-lg border border-border/70",
        areColorsIndistinguishable(entry.color, WHITE) ? "bg-card" : "bg-transparent",
      )}
      style={squareStyle(entry)}
    />
  );
}

export function PaletteEditor({
  isEditing,
  palette,
  onAdd,
  onChangeColorText,
  onChangeName,
  onRemove,
  onReorder,
  showAddCard = true,
}: PaletteEditorProps) {
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {palette.map((entry) => {
        const labelText = `Remove color ${entry.name}`;
        const nameId = `color_name_${entry.id}`;
        const valueId = `color_value_${entry.id}`;
        const isDragSource = activeDragId === entry.id;
        const isDropTarget = dropTargetId === entry.id;

        return (
          <Card
            className={cn(
              isDragSource && "opacity-60",
              isDropTarget && "ring-2 ring-primary/20",
            )}
            key={entry.id}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, entry.id)}
            onDrop={(event) => handleDrop(event, entry.id)}
            size="sm"
          >
            <div className="relative px-3 pt-3">
              <Swatch entry={entry} />
              <div
                aria-label={`Drag to reorder ${entry.name}`}
                className="absolute top-4 left-4 flex size-7 cursor-grab items-center justify-center rounded-md border bg-background/90 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
                draggable
                onDragStart={(event) => handleDragStart(event, entry.id)}
                role="button"
                tabIndex={-1}
                title={`Drag to reorder ${entry.name}`}
              >
                <GripVertical />
              </div>
              {palette.length > 1 ? (
                <Button
                  aria-label={labelText}
                  className="absolute top-4 right-4"
                  onClick={() => onRemove(entry.id)}
                  size="icon-xs"
                  title={labelText}
                  type="button"
                  variant="outline"
                >
                  <X />
                </Button>
              ) : null}
            </div>
            <CardContent className="flex flex-col gap-3 pt-0">
              {isEditing ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={nameId}>Color name</FieldLabel>
                    <Input
                      id={nameId}
                      onChange={(event) => onChangeName(entry.id, event.target.value)}
                      type="text"
                      value={entry.name}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={valueId}>Hex value</FieldLabel>
                    <Input
                      id={valueId}
                      onChange={(event) =>
                        handleColorChange(event, entry.id, onChangeColorText)
                      }
                      placeholder="FF0000"
                      spellCheck={false}
                      type="text"
                      value={entry.editableColor}
                    />
                    <FieldDescription>
                      Enter a 3 or 6 digit hex value without the leading #.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.color}</p>
                  </div>
                  <Badge variant="outline">{entry.color.slice(1).toUpperCase()}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {showAddCard ? (
        <Card className="border-dashed" size="sm">
          <button
            className="flex min-h-44 w-full flex-col items-center justify-center gap-4 rounded-lg px-6 py-8 text-center"
            onClick={onAdd}
            type="button"
          >
            <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-foreground">
              <Plus />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">
                Add another color
              </span>
              <span className="text-sm text-muted-foreground">
                Expand the matrix and drag any swatch to reorder the axis.
              </span>
            </div>
          </button>
        </Card>
      ) : null}
    </div>
  );
}
