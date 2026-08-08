import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Copy, Minus, Plus, Replace, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import {
  EQUIP_LABEL,
  MUSCLE_LABEL,
  alternativesFor,
  suggestProgression,
  swapSeriesExercise,
  type LibraryExercise,
} from "@/lib/intervall/exercise-library";
import { formatMmSs } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";
import { defaultSeries, exerciseLogKey } from "@/lib/intervall/timeline";
import type { Environment, Series, Sport, Template } from "@/lib/intervall/types";
import { ZONE_META } from "@/lib/intervall/zones";
import { uid } from "@/lib/utils";
import { MmSsInputs } from "./MmSsInputs";
import {
  ProgramVolumeCard,
  StrengthProgramBuilder,
  StrengthProgramTools,
} from "./StrengthProgramBuilder";

const ENV_BY_SPORT: Record<Sport, Environment[]> = {
  running: ["treadmill", "outdoor"],
  strength: ["gym", "home"],
  mobility: ["home", "gym"],
};

const ENV_LABELS: Record<Environment, string> = {
  treadmill: "Mølle",
  outdoor: "Ute",
  gym: "Gym",
  home: "Hjemme",
};

export function TemplateForm({ initial }: { initial?: Template }) {
  const navigate = useNavigate();
  const upsert = useIntervallStore((s) => s.upsertTemplate);
  const speedUnit = useIntervallStore((s) => s.settings.speedUnit);
  const weightStepKg = useIntervallStore((s) => s.settings.weightStepKg);
  const exerciseLogs = useIntervallStore((s) => s.exerciseLogs);

  const [name, setName] = useState(initial?.name ?? "");
  const [sport, setSport] = useState<Sport>(initial?.sport ?? "running");
  const [environment, setEnvironment] = useState<Environment>(
    initial?.environment ?? "treadmill",
  );
  const [programTag, setProgramTag] = useState(initial?.programTag ?? "");
  const [series, setSeries] = useState<Series[]>(
    () =>
      initial?.series?.length
        ? initial.series
        : [defaultSeries("running", "draft-ser-1")],
  );
  const [swapOpenId, setSwapOpenId] = useState<string | null>(null);
  const [packNotice, setPackNotice] = useState<string | null>(null);

  const envs = ENV_BY_SPORT[sport];
  const canSave = name.trim().length > 0 && series.length > 0;
  const totalDrags = useMemo(() => series.reduce((n, s) => n + s.reps, 0), [series]);

  function changeSport(next: Sport) {
    setSport(next);
    const allowed = ENV_BY_SPORT[next];
    if (!allowed.includes(environment)) setEnvironment(allowed[0]!);
    if (!initial) {
      setSeries([defaultSeries(next, "draft-ser-1")]);
      setProgramTag("");
    }
  }

  function updateSeries(id: string, partial: Partial<Series>) {
    setSeries((list) => list.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  }

  function moveSeries(id: string, dir: -1 | 1) {
    setSeries((list) => {
      const i = list.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const copy = [...list];
      const tmp = copy[i]!;
      copy[i] = copy[j]!;
      copy[j] = tmp;
      return copy;
    });
  }

  function duplicateSeries(id: string) {
    setSeries((list) => {
      const i = list.findIndex((s) => s.id === id);
      if (i < 0) return list;
      const src = list[i]!;
      const copy = { ...src, id: uid("ser") };
      const next = [...list];
      next.splice(i + 1, 0, copy);
      return next;
    });
  }

  function applySwap(seriesId: string, next: LibraryExercise) {
    setSeries((list) =>
      list.map((s) => (s.id === seriesId ? swapSeriesExercise(s, next) : s)),
    );
    setSwapOpenId(null);
  }

  function applyProgressionHints() {
    setSeries((list) =>
      list.map((ser) => {
        const key = exerciseLogKey(ser);
        const log = exerciseLogs[key];
        const { weightKg } = suggestProgression(
          log?.weightKg,
          log?.reps,
          ser.targetReps ?? 8,
          weightStepKg,
        );
        if (weightKg == null) return ser;
        return { ...ser, targetWeightKg: weightKg };
      }),
    );
  }

  function save() {
    if (!canSave) return;
    const tpl: Template = {
      id: initial?.id ?? uid("tpl"),
      name: name.trim(),
      sport,
      environment,
      series,
      programTag: programTag.trim() || undefined,
      isSeed: false,
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    upsert(tpl);
    void navigate({ to: "/" });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Navn</Label>
        <Input
          id="name"
          placeholder={
            sport === "strength" ? "F.eks. Fullkropp A" : "F.eks. 4×4 terskel"
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Sport</Label>
          <Segmented
            value={sport}
            onChange={changeSport}
            options={[
              { value: "running", label: "Løping" },
              { value: "strength", label: "Styrke" },
              { value: "mobility", label: "Beveg." },
            ]}
          />
        </div>
        <div className="space-y-2">
          <Label>Miljø</Label>
          <Segmented
            value={environment}
            onChange={setEnvironment}
            options={envs.map((e) => ({ value: e, label: ENV_LABELS[e] }))}
          />
        </div>
      </div>

      {sport === "strength" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="tag">Programtype (valgfritt)</Label>
            <Input
              id="tag"
              placeholder="F.eks. Push, Fullkropp, Bein"
              value={programTag}
              onChange={(e) => setProgramTag(e.target.value)}
            />
          </div>

          <StrengthProgramBuilder
            environment={environment}
            onApplyBlueprint={(next, meta) => {
              setSeries(next);
              if (!name.trim()) setName(meta.name);
              setProgramTag(meta.tag);
              setEnvironment(
                meta.env === "home" || meta.env === "gym" ? meta.env : environment,
              );
              setPackNotice(null);
            }}
            onAddExercise={(ser) => setSeries((list) => [...list, ser])}
            onApplyPack={(days) => {
              const now = Date.now();
              days.forEach((day, i) => {
                upsert({
                  id: uid("tpl"),
                  name: day.name,
                  sport: "strength",
                  environment:
                    day.env === "home" || day.env === "gym" ? day.env : "gym",
                  series: day.series,
                  programTag: day.tag,
                  isSeed: false,
                  createdAt: now + i,
                  updatedAt: now + i,
                });
              });
              // Load first day into editor for further tweak
              const first = days[0]!;
              setName(first.name);
              setProgramTag(first.tag);
              setEnvironment(
                first.env === "home" || first.env === "gym" ? first.env : "gym",
              );
              setSeries(first.series);
              setPackNotice(
                `${days.length} økter lagret på hjemskjermen (${days.map((d) => d.name).join(", ")})`,
              );
            }}
          />

          {packNotice && (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              {packNotice}
            </p>
          )}

          {series.length > 0 && (
            <>
              <ProgramVolumeCard series={series} />
              <StrengthProgramTools
                series={series}
                onChange={setSeries}
                weightStepKg={weightStepKg}
              />
            </>
          )}

          {Object.keys(exerciseLogs).length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={applyProgressionHints}
            >
              Bruk progresjon fra historikk
            </Button>
          )}
        </>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">
              {sport === "strength" ? `Øvelser (${series.length})` : `Serier (${series.length})`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {sport === "strength"
                ? `${totalDrags} sett totalt`
                : `${totalDrags} drag totalt`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSeries((s) => [...s, defaultSeries(sport)])}
          >
            <Plus /> {sport === "strength" ? "Tom øvelse" : "Ny serie"}
          </Button>
        </div>

        {series.map((ser, idx) => {
          const alts = sport === "strength" ? alternativesFor(ser) : [];
          const swapOpen = swapOpenId === ser.id;

          return (
            <Card key={ser.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {sport === "strength" ? `Øvelse ${idx + 1}` : `Serie ${idx + 1}`} ·{" "}
                    {ser.reps} {sport === "strength" ? "sett" : "drag"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Flytt opp"
                      onClick={() => moveSeries(ser.id, -1)}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Flytt ned"
                      onClick={() => moveSeries(ser.id, 1)}
                    >
                      <ChevronDown />
                    </Button>
                    {sport === "strength" && (
                      <>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Dupliser"
                          onClick={() => duplicateSeries(ser.id)}
                        >
                          <Copy />
                        </Button>
                        {alts.length > 0 && (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant={swapOpen ? "secondary" : "ghost"}
                            aria-label="Bytt øvelse"
                            onClick={() =>
                              setSwapOpenId(swapOpen ? null : ser.id)
                            }
                          >
                            <Replace />
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="Slett"
                      disabled={series.length === 1}
                      onClick={() =>
                        setSeries((list) => list.filter((s) => s.id !== ser.id))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {swapOpen && alts.length > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-2">
                    <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Bytt til alternativ
                    </p>
                    {alts.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        onClick={() => applySwap(ser.id, alt)}
                      >
                        <span className="font-medium">{alt.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {EQUIP_LABEL[alt.equipment]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {(sport === "strength" || sport === "mobility") && (
                  <div className="space-y-2">
                    <Label htmlFor={`ex-${ser.id}`}>
                      {sport === "strength" ? "Øvelse" : "Navn / fokus"}
                    </Label>
                    <Input
                      id={`ex-${ser.id}`}
                      value={ser.exerciseName ?? ""}
                      placeholder={sport === "strength" ? "Knebøy" : "Hofteåpner"}
                      onChange={(e) =>
                        updateSeries(ser.id, { exerciseName: e.target.value })
                      }
                    />
                    {sport === "strength" && (ser.muscleGroup || ser.equipment) && (
                      <p className="text-[11px] text-muted-foreground">
                        {ser.muscleGroup ? MUSCLE_LABEL[ser.muscleGroup] : ""}
                        {ser.muscleGroup && ser.equipment ? " · " : ""}
                        {ser.equipment ? EQUIP_LABEL[ser.equipment] : ""}
                      </p>
                    )}
                  </div>
                )}

                {sport === "strength" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`reps-${ser.id}`}>Reps / sett</Label>
                        <Input
                          id={`reps-${ser.id}`}
                          type="number"
                          min={1}
                          value={ser.targetReps ?? 8}
                          onChange={(e) =>
                            updateSeries(ser.id, {
                              targetReps: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`kg-${ser.id}`}>Vekt (kg)</Label>
                        <Input
                          id={`kg-${ser.id}`}
                          type="number"
                          min={0}
                          step={0.5}
                          value={ser.targetWeightKg ?? ""}
                          placeholder="Valgfritt"
                          onChange={(e) =>
                            updateSeries(ser.id, {
                              targetWeightKg: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </div>
                    </div>

                    {(() => {
                      const key = exerciseLogKey(ser);
                      const log = exerciseLogs[key];
                      if (!log) return null;
                      const hint = suggestProgression(
                        log.weightKg,
                        log.reps,
                        ser.targetReps ?? 8,
                        weightStepKg,
                      );
                      return (
                        <p className="text-xs text-muted-foreground">{hint.note}</p>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`rpe-${ser.id}`}>Mål-RPE</Label>
                        <Input
                          id={`rpe-${ser.id}`}
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={ser.targetRpe ?? ""}
                          placeholder="f.eks. 8"
                          onChange={(e) =>
                            updateSeries(ser.id, {
                              targetRpe: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="opacity-0">.</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              updateSeries(ser.id, {
                                targetWeightKg: Math.max(
                                  0,
                                  (ser.targetWeightKg ?? 0) - weightStepKg,
                                ),
                              })
                            }
                          >
                            −{weightStepKg}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              updateSeries(ser.id, {
                                targetWeightKg:
                                  (ser.targetWeightKg ?? 0) + weightStepKg,
                              })
                            }
                          >
                            +{weightStepKg}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${ser.id}`}>Notat / cue</Label>
                      <Input
                        id={`notes-${ser.id}`}
                        value={ser.notes ?? ""}
                        placeholder="F.eks. knær ut, bryst opp"
                        onChange={(e) =>
                          updateSeries(ser.id, { notes: e.target.value })
                        }
                      />
                    </div>

                    <MmSsInputs
                      id={`rest-${ser.id}`}
                      label="Pause mellom sett"
                      valueSec={ser.restSec}
                      onChange={(restSec) => updateSeries(ser.id, { restSec })}
                    />
                    <div className="space-y-2">
                      <Label>Antall sett</Label>
                      <RepStepper
                        value={ser.reps}
                        onChange={(reps) => updateSeries(ser.id, { reps })}
                        unit="sett"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <MmSsInputs
                      id={`dur-${ser.id}`}
                      label="Varighet"
                      valueSec={ser.durationSec}
                      onChange={(durationSec) =>
                        updateSeries(ser.id, { durationSec })
                      }
                    />
                    {sport === "running" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`spd-${ser.id}`}>
                            Målfart ({speedUnit === "kmh" ? "km/t" : "pace"})
                          </Label>
                          <Input
                            id={`spd-${ser.id}`}
                            type="number"
                            step={0.1}
                            min={0}
                            value={ser.targetSpeedKmh ?? ""}
                            onChange={(e) =>
                              updateSeries(ser.id, {
                                targetSpeedKmh: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zone-${ser.id}`}>Pulssone</Label>
                          <select
                            id={`zone-${ser.id}`}
                            className="flex h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                            value={ser.targetZone ?? 4}
                            onChange={(e) =>
                              updateSeries(ser.id, {
                                targetZone: Number(e.target.value) as
                                  | 1
                                  | 2
                                  | 3
                                  | 4
                                  | 5,
                              })
                            }
                          >
                            {([1, 2, 3, 4, 5] as const).map((z) => (
                              <option key={z} value={z}>
                                Sone {z} · {ZONE_META[z].name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {ser.targetZone && sport === "running" && (
                      <p className="text-xs text-muted-foreground">
                        {ZONE_META[ser.targetZone].name} —{" "}
                        {ZONE_META[ser.targetZone].breathing.toLowerCase()}
                      </p>
                    )}
                    <MmSsInputs
                      id={`rest-${ser.id}`}
                      label="Pause etter hvert drag"
                      valueSec={ser.restSec}
                      onChange={(restSec) => updateSeries(ser.id, { restSec })}
                    />
                    <div className="space-y-2">
                      <Label>Antall drag</Label>
                      <RepStepper
                        value={ser.reps}
                        onChange={(reps) => updateSeries(ser.id, { reps })}
                        unit="drag"
                        summary={`${ser.reps} × ${formatMmSs(ser.durationSec)} med ${formatMmSs(ser.restSec)} pause`}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button type="button" size="lg" className="w-full" disabled={!canSave} onClick={save}>
        Lagre økt
      </Button>
    </div>
  );
}

function RepStepper({
  value,
  onChange,
  unit,
  summary,
}: {
  value: number;
  onChange: (n: number) => void;
  unit: string;
  summary?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Færre ${unit}`}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus />
        </Button>
        <Input
          type="number"
          min={1}
          className="text-center"
          value={value}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Flere ${unit}`}
          onClick={() => onChange(value + 1)}
        >
          <Plus />
        </Button>
      </div>
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
    </div>
  );
}
