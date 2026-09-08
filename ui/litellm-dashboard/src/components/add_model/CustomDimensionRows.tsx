import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { CustomDimensionRow } from "./custom_dimensions";

interface Props {
  rows: CustomDimensionRow[];
  disabled: boolean;
  onChange: (rows: CustomDimensionRow[]) => void;
  onWeight: (id: string, weight: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function CustomDimensionRows({ rows, disabled, onChange, onWeight, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState<{ id: string; raw: string } | null>(null);
  const update = (id: string, patch: Partial<CustomDimensionRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const editWeight = (id: string, raw: string) => {
    setDraft({ id, raw });
    if (raw.trim() && Number.isFinite(Number(raw))) onWeight(id, Number(raw));
  };
  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <fieldset key={row.id} className="min-w-0 space-y-3 rounded-md border p-3">
          <legend className="px-1 text-xs">Custom dimension {index + 1}</legend>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor={`${row.id}-name`}>Name</Label>
              <Input
                id={`${row.id}-name`}
                value={row.name}
                maxLength={64}
                onChange={(event) => update(row.id, { name: event.target.value })}
              />
            </div>
            <Button type="button" variant="ghost" disabled={disabled} onClick={() => onRemove(row.id)}>
              Remove
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor={`${row.id}-weight`}>Weight</Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              disabled={disabled}
              value={[row.weight]}
              className="min-w-24 flex-1"
              aria-label={`${row.name || `Custom dimension ${index + 1}`} weight`}
              onValueChange={(value) => onWeight(row.id, Array.isArray(value) ? value[0] : value)}
            />
            <Input
              id={`${row.id}-weight`}
              className="w-24"
              inputMode="decimal"
              disabled={disabled}
              value={draft?.id === row.id ? draft.raw : Number(row.weight.toPrecision(6)).toString()}
              onBlur={() => setDraft(null)}
              onChange={(event) => editWeight(row.id, event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["keywords", "patterns"] as const).map((field) => (
              <div key={field} className="min-w-0 space-y-1">
                <Label htmlFor={`${row.id}-${field}`}>
                  {field === "keywords" ? "Keywords" : "Regex patterns"} (one per line)
                </Label>
                <Textarea
                  id={`${row.id}-${field}`}
                  rows={2}
                  value={row[field]?.join("\n") ?? ""}
                  onChange={(event) =>
                    update(row.id, { [field]: event.target.value ? event.target.value.split("\n") : [] })
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${row.id}-scoring`}>Scoring</Label>
            <Select
              value={row.scoring_mode ?? "binary"}
              onValueChange={(mode) => {
                if (mode === "binary" || mode === "match_count") update(row.id, { scoring_mode: mode });
              }}
            >
              <SelectTrigger id={`${row.id}-scoring`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">Binary</SelectItem>
                <SelectItem value="match_count">Match count</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Binary uses the full weight for any hit. Match count uses half for one distinct matcher and full weight
              for two or more.
            </p>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled || rows.length >= 16} onClick={onAdd}>
        Add custom dimension
      </Button>
      <p className="text-xs text-muted-foreground">
        Keywords match the current ask. Regex scans its first 2,048 characters and permits bounded single-character
        repeats up to 64. The proxy validates patterns on save.
      </p>
    </div>
  );
}
