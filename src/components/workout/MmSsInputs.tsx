import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseMmSs, splitMmSs } from "@/lib/intervall/format";

export function MmSsInputs({
  id,
  label,
  valueSec,
  onChange,
}: {
  id: string;
  label: string;
  valueSec: number;
  onChange: (sec: number) => void;
}) {
  const { min, sec } = splitMmSs(valueSec);
  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-min`}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            id={`${id}-min`}
            type="number"
            inputMode="numeric"
            min={0}
            className="text-center"
            value={min}
            aria-label={`${label} — minutter`}
            onChange={(e) => onChange(parseMmSs(Number(e.target.value) || 0, sec))}
          />
          <p className="mt-1 text-center text-xs text-muted-foreground">min</p>
        </div>
        <span className="pb-5 text-lg text-muted-foreground">:</span>
        <div className="flex-1">
          <Input
            id={`${id}-sec`}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            className="text-center"
            value={sec}
            aria-label={`${label} — sekunder`}
            onChange={(e) =>
              onChange(parseMmSs(min, Math.min(59, Number(e.target.value) || 0)))
            }
          />
          <p className="mt-1 text-center text-xs text-muted-foreground">sek</p>
        </div>
      </div>
    </div>
  );
}
