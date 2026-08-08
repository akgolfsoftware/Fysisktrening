import { uid } from "@/lib/utils";
import type { Series, Sport, Template, TimelinePhase } from "./types";

function seriesLabel(kind: Series["kind"], sport: Sport): string {
  if (sport === "strength") {
    if (kind === "rest") return "Pause";
    return "Sett";
  }
  switch (kind) {
    case "warmup":
      return "Oppvarming";
    case "cooldown":
      return "Nedtrapping";
    case "rest":
      return "Pause";
    default:
      return "Drag";
  }
}

/** Flatten a template into a playable phase timeline */
export function buildTimeline(template: Template): TimelinePhase[] {
  const phases: TimelinePhase[] = [];

  for (const series of template.series) {
    if (template.sport === "strength") {
      for (let i = 0; i < series.reps; i++) {
        phases.push({
          id: uid("ph"),
          seriesId: series.id,
          label: series.exerciseName?.trim() || seriesLabel("work", "strength"),
          kind: "work",
          durationSec: 0,
          setIndex: i + 1,
          setTotal: series.reps,
          exerciseName: series.exerciseName,
          targetReps: series.targetReps ?? 8,
          targetWeightKg: series.targetWeightKg,
          notes: series.notes,
          targetRpe: series.targetRpe,
          libraryId: series.libraryId,
          manual: true,
        });
        if (i < series.reps - 1 && series.restSec > 0) {
          phases.push({
            id: uid("ph"),
            seriesId: series.id,
            label: "Pause",
            kind: "rest",
            durationSec: series.restSec,
            setIndex: i + 1,
            setTotal: series.reps,
            exerciseName: series.exerciseName,
          });
        }
      }
      continue;
    }

    for (let i = 0; i < series.reps; i++) {
      phases.push({
        id: uid("ph"),
        seriesId: series.id,
        label: seriesLabel(series.kind, template.sport),
        kind: series.kind === "rest" ? "work" : series.kind,
        durationSec: series.durationSec,
        setIndex: i + 1,
        setTotal: series.reps,
        targetSpeedKmh: series.targetSpeedKmh,
        targetZone: series.targetZone,
        exerciseName: series.exerciseName,
      });
      if (series.restSec > 0) {
        phases.push({
          id: uid("ph"),
          seriesId: series.id,
          label: "Pause",
          kind: "rest",
          durationSec: series.restSec,
          setIndex: i + 1,
          setTotal: series.reps,
        });
      }
    }
  }

  return phases;
}

export function defaultSeries(sport: Sport, stableId?: string): Series {
  const id = stableId ?? uid("ser");
  if (sport === "strength") {
    return {
      id,
      kind: "work",
      durationSec: 0,
      restSec: 90,
      reps: 3,
      exerciseName: "Knebøy",
      targetReps: 8,
      targetWeightKg: 40,
      muscleGroup: "legs",
      equipment: "barbell",
      libraryId: "ex_squat",
    };
  }
  if (sport === "mobility") {
    return {
      id,
      kind: "work",
      durationSec: 45,
      restSec: 15,
      reps: 6,
      exerciseName: "Hofteåpner",
      targetZone: 1,
    };
  }
  return {
    id,
    kind: "work",
    durationSec: 240,
    restSec: 120,
    reps: 4,
    targetSpeedKmh: 12,
    targetZone: 4,
  };
}

export function exerciseLogKey(series: {
  libraryId?: string;
  exerciseName?: string;
}): string {
  return series.libraryId || series.exerciseName?.toLowerCase().trim() || "unknown";
}
