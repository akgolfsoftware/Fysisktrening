import { BookOpen, CalendarRange, Dumbbell, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EQUIP_LABEL,
  EXERCISE_LIBRARY,
  MUSCLE_LABEL,
  PROGRAM_BLUEPRINTS,
  PROGRAM_PACKS,
  REP_SCHEMES,
  type Equipment,
  type LibraryExercise,
  type MuscleGroup,
  type ProgramBlueprint,
  type ProgramPack,
  type RepScheme,
  applyRepScheme,
  blueprintToSeries,
  getBlueprint,
  libraryToSeries,
  programStats,
} from "@/lib/intervall/exercise-library";
import { formatMmSs } from "@/lib/intervall/format";
import type { Environment, Series } from "@/lib/intervall/types";
import { cn, uid } from "@/lib/utils";

type Props = {
  environment: Environment;
  onApplyBlueprint: (series: Series[], meta: { name: string; tag: string; env: Environment }) => void;
  onAddExercise: (series: Series) => void;
  /** Create several day-templates at once (weekly pack) */
  onApplyPack?: (
    days: Array<{ name: string; tag: string; env: Environment; series: Series[] }>,
  ) => void;
};

const MUSCLE_FILTERS: Array<MuscleGroup | "all"> = [
  "all",
  "legs",
  "push",
  "pull",
  "core",
];

const EQUIP_FILTERS: Array<Equipment | "all"> = [
  "all",
  "barbell",
  "dumbbell",
  "bodyweight",
  "machine",
  "cable",
  "band",
];

export function StrengthProgramBuilder({
  environment,
  onApplyBlueprint,
  onAddExercise,
  onApplyPack,
}: Props) {
  const [tab, setTab] = useState<"programs" | "packs" | "library">("programs");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [homeOnly, setHomeOnly] = useState(environment === "home");
  const [customName, setCustomName] = useState("");
  const [packApplied, setPackApplied] = useState<string | null>(null);

  const programs = useMemo(() => {
    return PROGRAM_BLUEPRINTS.filter((p) => {
      if (homeOnly) return p.environment === "home";
      return true;
    });
  }, [homeOnly]);

  const packs = useMemo(() => {
    return PROGRAM_PACKS.filter((p) => {
      if (homeOnly) return p.environment === "home";
      return true;
    });
  }, [homeOnly]);

  const exercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => {
      if (
        homeOnly &&
        !e.homeFriendly &&
        e.equipment !== "bodyweight" &&
        e.equipment !== "dumbbell" &&
        e.equipment !== "band"
      ) {
        return false;
      }
      if (muscle !== "all" && e.muscleGroup !== muscle) return false;
      if (equipment !== "all" && e.equipment !== equipment) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        MUSCLE_LABEL[e.muscleGroup].toLowerCase().includes(q) ||
        EQUIP_LABEL[e.equipment].toLowerCase().includes(q)
      );
    });
  }, [query, muscle, equipment, homeOnly]);

  function applyPack(pack: ProgramPack) {
    const days = pack.days
      .map((d) => {
        const bp = getBlueprint(d.blueprintId);
        if (!bp) return null;
        return {
          name: d.name,
          tag: d.tag,
          env: pack.environment,
          series: blueprintToSeries(bp),
        };
      })
      .filter((d): d is NonNullable<typeof d> => Boolean(d));

    if (days.length === 0) return;

    if (onApplyPack) {
      onApplyPack(days);
      setPackApplied(pack.id);
      return;
    }
    const first = days[0]!;
    onApplyBlueprint(first.series, {
      name: first.name,
      tag: first.tag,
      env: first.env,
    });
    setPackApplied(pack.id);
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="space-y-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Tilpass styrkeprogram</h2>
            <p className="text-xs text-muted-foreground">
              Maler, ukeplaner eller plukk øvelser fra biblioteket
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-muted p-1">
          {(
            [
              { id: "programs" as const, label: "Maler", icon: BookOpen },
              { id: "packs" as const, label: "Uke", icon: CalendarRange },
              { id: "library" as const, label: "Øvelser", icon: Dumbbell },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
                tab === id ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
              onClick={() => setTab(id)}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={homeOnly}
            onChange={(e) => setHomeOnly(e.target.checked)}
          />
          Kun hjemmevennlige øvelser
        </label>

        {tab === "programs" && (
          <div className="space-y-2">
            {programs.map((bp) => (
              <BlueprintRow
                key={bp.id}
                blueprint={bp}
                onApply={() => {
                  const series = blueprintToSeries(bp);
                  onApplyBlueprint(series, {
                    name: bp.name,
                    tag:
                      bp.focus === "split"
                        ? "Split"
                        : (MUSCLE_LABEL[bp.focus as MuscleGroup] ?? bp.name),
                    env: bp.environment,
                  });
                }}
              />
            ))}
            {programs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen maler matcher filteret.
              </p>
            )}
          </div>
        )}

        {tab === "packs" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Oppretter flere økter på én gang (f.eks. Push, Pull og Legs).
            </p>
            {packs.map((pack) => (
              <PackRow
                key={pack.id}
                pack={pack}
                applied={packApplied === pack.id}
                onApply={() => applyPack(pack)}
              />
            ))}
            {packs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen ukeplaner matcher filteret.
              </p>
            )}
          </div>
        )}

        {tab === "library" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Søk øvelse, muskel, utstyr…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_FILTERS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMuscle(m)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    muscle === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "all" ? "Alle" : MUSCLE_LABEL[m]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EQUIP_FILTERS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setEquipment(eq)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    equipment === eq
                      ? "bg-strength text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {eq === "all" ? "Alt utstyr" : EQUIP_LABEL[eq]}
                </button>
              ))}
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  onAdd={() => onAddExercise(libraryToSeries(ex))}
                />
              ))}
              {exercises.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Ingen treff
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <Label htmlFor="custom-ex">Egen øvelse (fritekst)</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-ex"
                  placeholder="F.eks. Hip thrust"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!customName.trim()}
                  onClick={() => {
                    const name = customName.trim();
                    if (!name) return;
                    onAddExercise({
                      id: uid("ser"),
                      kind: "work",
                      durationSec: 0,
                      restSec: 90,
                      reps: 3,
                      exerciseName: name,
                      targetReps: 10,
                      muscleGroup: "full",
                    });
                    setCustomName("");
                  }}
                >
                  Legg til
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BlueprintRow({
  blueprint,
  onApply,
}: {
  blueprint: ProgramBlueprint;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{blueprint.name}</p>
        <p className="text-xs text-muted-foreground">{blueprint.description}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {blueprint.exerciseIds.length} øvelser ·{" "}
          {blueprint.environment === "home" ? "Hjemme" : "Gym"}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onApply}>
        Bruk
      </Button>
    </div>
  );
}

function PackRow({
  pack,
  onApply,
  applied,
}: {
  pack: ProgramPack;
  onApply: () => void;
  applied: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{pack.name}</p>
        <p className="text-xs text-muted-foreground">{pack.description}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {pack.days.map((d) => d.name).join(" · ")}
        </p>
      </div>
      <Button type="button" size="sm" variant={applied ? "secondary" : "outline"} onClick={onApply}>
        {applied ? "Lagt til" : "Opprett"}
      </Button>
    </div>
  );
}

function ExerciseRow({
  exercise,
  onAdd,
}: {
  exercise: LibraryExercise;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{exercise.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {MUSCLE_LABEL[exercise.muscleGroup]} · {EQUIP_LABEL[exercise.equipment]} ·{" "}
          {exercise.defaultSets}×{exercise.defaultReps}
          {exercise.defaultWeightKg != null ? ` @ ${exercise.defaultWeightKg} kg` : ""}
        </p>
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={onAdd}>
        + Legg til
      </Button>
    </div>
  );
}

export function StrengthProgramTools({
  series,
  onChange,
  weightStepKg,
}: {
  series: Series[];
  onChange: (next: Series[]) => void;
  weightStepKg: number;
}) {
  function scaleWeights(factor: number) {
    onChange(
      series.map((s) =>
        s.targetWeightKg != null
          ? {
              ...s,
              targetWeightKg: Math.max(
                0,
                Math.round(s.targetWeightKg * factor * 2) / 2,
              ),
            }
          : s,
      ),
    );
  }

  function bumpWeights(delta: number) {
    onChange(
      series.map((s) =>
        s.targetWeightKg != null
          ? {
              ...s,
              targetWeightKg: Math.max(
                0,
                Math.round((s.targetWeightKg + delta) * 2) / 2,
              ),
            }
          : s,
      ),
    );
  }

  function setAllRest(sec: number) {
    onChange(series.map((s) => ({ ...s, restSec: sec })));
  }

  function applyScheme(scheme: RepScheme) {
    onChange(applyRepScheme(series, scheme));
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <Label className="text-xs text-muted-foreground">Hurtigjustering av program</Label>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Rep-skjema
        </p>
        <div className="flex flex-wrap gap-2">
          {REP_SCHEMES.map((scheme) => (
            <Button
              key={scheme.id}
              type="button"
              size="sm"
              variant="secondary"
              title={scheme.note}
              onClick={() => applyScheme(scheme)}
            >
              {scheme.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Vekt alle
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => bumpWeights(-weightStepKg)}>
            −{weightStepKg} kg
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => bumpWeights(weightStepKg)}>
            +{weightStepKg} kg
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => scaleWeights(0.9)}>
            90 %
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => scaleWeights(1.1)}>
            110 %
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Pause alle
        </p>
        <div className="flex flex-wrap gap-2">
          {[60, 90, 120, 180].map((sec) => (
            <Button
              key={sec}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAllRest(sec)}
            >
              {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgramVolumeCard({ series }: { series: Series[] }) {
  const stats = useMemo(() => programStats(series), [series]);
  if (series.length === 0) return null;

  const muscleEntries = Object.entries(stats.byMuscle) as Array<[MuscleGroup, number]>;

  return (
    <Card className="border-strength/25 bg-strength/[0.06]">
      <CardContent className="space-y-3 py-4">
        <div>
          <h2 className="font-display text-lg">Programoversikt</h2>
          <p className="text-xs text-muted-foreground">
            Estimater basert på ~45 s per sett + pauser
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Øvelser" value={String(stats.totalExercises)} />
          <Stat label="Sett" value={String(stats.totalSets)} />
          <Stat label="~tid" value={formatMmSs(stats.estSec)} />
        </div>
        {stats.tonnage > 0 && (
          <p className="text-xs text-muted-foreground">
            Estimert tonnasje:{" "}
            <span className="font-medium text-foreground">
              {Math.round(stats.tonnage).toLocaleString("nb-NO")} kg
            </span>
          </p>
        )}
        {muscleEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {muscleEntries.map(([m, sets]) => (
              <span
                key={m}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {MUSCLE_LABEL[m]} · {sets} sett
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 text-center shadow-[var(--shadow-soft)]">
      <p className="font-display text-xl font-medium tabular">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
