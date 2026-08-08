import type { Environment, Series } from "./types";
import { uid } from "@/lib/utils";

export type MuscleGroup = "legs" | "push" | "pull" | "core" | "full";
export type Equipment = "barbell" | "dumbbell" | "bodyweight" | "machine" | "band" | "cable";

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  defaultSets: number;
  defaultReps: number;
  defaultRestSec: number;
  defaultWeightKg?: number;
  homeFriendly?: boolean;
  hint?: string;
  /** Optional alternate library ids for one-tap swap */
  alternatives?: string[];
};

export type ProgramBlueprint = {
  id: string;
  name: string;
  description: string;
  environment: Environment;
  focus: MuscleGroup | "split";
  exerciseIds: string[];
};

/** Multi-day pack: creates several templates at once */
export type ProgramPack = {
  id: string;
  name: string;
  description: string;
  environment: Environment;
  days: Array<{ name: string; tag: string; blueprintId: string }>;
};

export type RepScheme = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSec: number;
  rpe?: number;
  note: string;
};

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  legs: "Bein",
  push: "Press",
  pull: "Trekk",
  core: "Kjerne",
  full: "Fullkropp",
};

export const EQUIP_LABEL: Record<Equipment, string> = {
  barbell: "Stang",
  dumbbell: "Hantler",
  bodyweight: "Kroppsvekt",
  machine: "Maskin",
  band: "Strikk",
  cable: "Kabel",
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  {
    id: "ex_squat",
    name: "Knebøy",
    muscleGroup: "legs",
    equipment: "barbell",
    defaultSets: 4,
    defaultReps: 6,
    defaultRestSec: 150,
    defaultWeightKg: 50,
    hint: "Hofte dypt, knær ut",
    alternatives: ["ex_goblet", "ex_legpress", "ex_lunge"],
  },
  {
    id: "ex_goblet",
    name: "Goblet squat",
    muscleGroup: "legs",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultWeightKg: 16,
    homeFriendly: true,
    alternatives: ["ex_squat", "ex_lunge"],
  },
  {
    id: "ex_rdl",
    name: "RDL (rumensk markløft)",
    muscleGroup: "legs",
    equipment: "barbell",
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 120,
    defaultWeightKg: 40,
    alternatives: ["ex_lunge", "ex_calf"],
  },
  {
    id: "ex_lunge",
    name: "Utfall",
    muscleGroup: "legs",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    defaultWeightKg: 12,
    homeFriendly: true,
    alternatives: ["ex_goblet", "ex_squat"],
  },
  {
    id: "ex_legpress",
    name: "Leg press",
    muscleGroup: "legs",
    equipment: "machine",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultWeightKg: 80,
    alternatives: ["ex_squat", "ex_goblet"],
  },
  {
    id: "ex_calf",
    name: "Tåhev",
    muscleGroup: "legs",
    equipment: "machine",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    defaultWeightKg: 40,
    homeFriendly: true,
  },
  {
    id: "ex_bench",
    name: "Benkpress",
    muscleGroup: "push",
    equipment: "barbell",
    defaultSets: 4,
    defaultReps: 6,
    defaultRestSec: 150,
    defaultWeightKg: 40,
    alternatives: ["ex_dbpress", "ex_pushup", "ex_fly"],
  },
  {
    id: "ex_dbpress",
    name: "Hantelpress",
    muscleGroup: "push",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultWeightKg: 16,
    homeFriendly: true,
    alternatives: ["ex_bench", "ex_pushup"],
  },
  {
    id: "ex_ohp",
    name: "Militærpress",
    muscleGroup: "push",
    equipment: "barbell",
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 120,
    defaultWeightKg: 30,
    alternatives: ["ex_pike", "ex_dbpress"],
  },
  {
    id: "ex_pushup",
    name: "Armhevinger",
    muscleGroup: "push",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    homeFriendly: true,
    alternatives: ["ex_bench", "ex_dbpress", "ex_dips"],
  },
  {
    id: "ex_pike",
    name: "Pike push-ups",
    muscleGroup: "push",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 60,
    homeFriendly: true,
    alternatives: ["ex_ohp", "ex_pushup"],
  },
  {
    id: "ex_dips",
    name: "Dips",
    muscleGroup: "push",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 75,
    homeFriendly: true,
    hint: "Stol eller parallel bars",
    alternatives: ["ex_pushup", "ex_bench"],
  },
  {
    id: "ex_fly",
    name: "Flyes",
    muscleGroup: "push",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    defaultWeightKg: 10,
    alternatives: ["ex_bench", "ex_dbpress"],
  },
  {
    id: "ex_row",
    name: "Roing",
    muscleGroup: "pull",
    equipment: "barbell",
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 120,
    defaultWeightKg: 35,
    alternatives: ["ex_dbrow", "ex_pulldown"],
  },
  {
    id: "ex_dbrow",
    name: "Enarms roing",
    muscleGroup: "pull",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    defaultWeightKg: 16,
    homeFriendly: true,
    alternatives: ["ex_row", "ex_pulldown"],
  },
  {
    id: "ex_pulldown",
    name: "Nedtrekk",
    muscleGroup: "pull",
    equipment: "cable",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultWeightKg: 40,
    alternatives: ["ex_pullup", "ex_row"],
  },
  {
    id: "ex_pullup",
    name: "Pull-ups / chin-ups",
    muscleGroup: "pull",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 6,
    defaultRestSec: 120,
    homeFriendly: true,
    alternatives: ["ex_pulldown", "ex_dbrow"],
  },
  {
    id: "ex_facepull",
    name: "Face pulls",
    muscleGroup: "pull",
    equipment: "cable",
    defaultSets: 3,
    defaultReps: 15,
    defaultRestSec: 60,
    defaultWeightKg: 15,
    hint: "Skulderhelse",
  },
  {
    id: "ex_curl",
    name: "Biceps curl",
    muscleGroup: "pull",
    equipment: "dumbbell",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    defaultWeightKg: 10,
    homeFriendly: true,
  },
  {
    id: "ex_plank",
    name: "Planke",
    muscleGroup: "core",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 45,
    defaultRestSec: 45,
    homeFriendly: true,
    hint: "Reps = sekunder hold",
    alternatives: ["ex_deadbug", "ex_pallof"],
  },
  {
    id: "ex_deadbug",
    name: "Dead bug",
    muscleGroup: "core",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 45,
    homeFriendly: true,
    alternatives: ["ex_plank", "ex_pallof"],
  },
  {
    id: "ex_hanging",
    name: "Hanging knee raise",
    muscleGroup: "core",
    equipment: "bodyweight",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 60,
    alternatives: ["ex_plank", "ex_deadbug"],
  },
  {
    id: "ex_pallof",
    name: "Pallof press",
    muscleGroup: "core",
    equipment: "band",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 45,
    homeFriendly: true,
    alternatives: ["ex_plank", "ex_deadbug"],
  },
];

export const PROGRAM_BLUEPRINTS: ProgramBlueprint[] = [
  {
    id: "bp_full_a",
    name: "Fullkropp A",
    description: "Klassisk styrke: knebøy, press, trekk, kjerne",
    environment: "gym",
    focus: "full",
    exerciseIds: ["ex_squat", "ex_bench", "ex_row", "ex_plank"],
  },
  {
    id: "bp_full_b",
    name: "Fullkropp B",
    description: "Markløft-variant, overhead, trekk, kjerne",
    environment: "gym",
    focus: "full",
    exerciseIds: ["ex_rdl", "ex_ohp", "ex_pulldown", "ex_deadbug"],
  },
  {
    id: "bp_push",
    name: "Push-dag",
    description: "Bryst, skuldre, triceps",
    environment: "gym",
    focus: "push",
    exerciseIds: ["ex_bench", "ex_ohp", "ex_dips", "ex_fly"],
  },
  {
    id: "bp_pull",
    name: "Pull-dag",
    description: "Rygg og biceps",
    environment: "gym",
    focus: "pull",
    exerciseIds: ["ex_row", "ex_pulldown", "ex_facepull", "ex_curl"],
  },
  {
    id: "bp_legs",
    name: "Bein-dag",
    description: "Knebøy, bakside, utfall, legger",
    environment: "gym",
    focus: "legs",
    exerciseIds: ["ex_squat", "ex_rdl", "ex_lunge", "ex_calf"],
  },
  {
    id: "bp_upper",
    name: "Overkropp",
    description: "Press + trekk balanse",
    environment: "gym",
    focus: "split",
    exerciseIds: ["ex_bench", "ex_row", "ex_ohp", "ex_pulldown", "ex_plank"],
  },
  {
    id: "bp_home",
    name: "Hjemme uten stang",
    description: "Kroppsvekt og hantler",
    environment: "home",
    focus: "full",
    exerciseIds: ["ex_goblet", "ex_pushup", "ex_dbrow", "ex_pike", "ex_plank"],
  },
  {
    id: "bp_home_push",
    name: "Hjemme push",
    description: "Kun kroppsvekt",
    environment: "home",
    focus: "push",
    exerciseIds: ["ex_pushup", "ex_pike", "ex_dips", "ex_plank"],
  },
  {
    id: "bp_5x5",
    name: "5×5 styrke",
    description: "Tre store løft, 5 sett × 5 reps",
    environment: "gym",
    focus: "full",
    exerciseIds: ["ex_squat", "ex_bench", "ex_row"],
  },
  {
    id: "bp_home_full",
    name: "Hjemme fullkropp + kjerne",
    description: "Ingen stang, ~30–40 min",
    environment: "home",
    focus: "full",
    exerciseIds: ["ex_goblet", "ex_pushup", "ex_dbrow", "ex_deadbug", "ex_pallof"],
  },
];

export const PROGRAM_PACKS: ProgramPack[] = [
  {
    id: "pack_ppl",
    name: "Push / Pull / Legs",
    description: "3 dager · klassisk split for gym",
    environment: "gym",
    days: [
      { name: "Push-dag", tag: "Push", blueprintId: "bp_push" },
      { name: "Pull-dag", tag: "Pull", blueprintId: "bp_pull" },
      { name: "Bein-dag", tag: "Bein", blueprintId: "bp_legs" },
    ],
  },
  {
    id: "pack_full_ab",
    name: "Fullkropp A/B",
    description: "2 dager · veksle A og B gjennom uka",
    environment: "gym",
    days: [
      { name: "Fullkropp A", tag: "Fullkropp", blueprintId: "bp_full_a" },
      { name: "Fullkropp B", tag: "Fullkropp", blueprintId: "bp_full_b" },
    ],
  },
  {
    id: "pack_home_3",
    name: "Hjemme 3-dagers",
    description: "Fullkropp + push + kjerne · uten stang",
    environment: "home",
    days: [
      { name: "Hjemme fullkropp", tag: "Fullkropp", blueprintId: "bp_home" },
      { name: "Hjemme push", tag: "Press", blueprintId: "bp_home_push" },
      { name: "Hjemme full + kjerne", tag: "Fullkropp", blueprintId: "bp_home_full" },
    ],
  },
];

export const REP_SCHEMES: RepScheme[] = [
  {
    id: "rs_5x5",
    name: "5×5",
    sets: 5,
    reps: 5,
    restSec: 180,
    rpe: 8,
    note: "Styrke · lange pauser",
  },
  {
    id: "rs_3x8",
    name: "3×8",
    sets: 3,
    reps: 8,
    restSec: 120,
    rpe: 7.5,
    note: "Hypertrofi / styrke",
  },
  {
    id: "rs_3x10",
    name: "3×10",
    sets: 3,
    reps: 10,
    restSec: 90,
    rpe: 7,
    note: "Volum",
  },
  {
    id: "rs_4x6",
    name: "4×6",
    sets: 4,
    reps: 6,
    restSec: 150,
    rpe: 8,
    note: "Tungt · moderat volum",
  },
  {
    id: "rs_3x12",
    name: "3×12",
    sets: 3,
    reps: 12,
    restSec: 75,
    rpe: 7,
    note: "Pump / utholdende",
  },
];

export function getExercise(id: string): LibraryExercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}

export function getBlueprint(id: string): ProgramBlueprint | undefined {
  return PROGRAM_BLUEPRINTS.find((b) => b.id === id);
}

export function libraryToSeries(ex: LibraryExercise, overrides?: Partial<Series>): Series {
  return {
    id: uid("ser"),
    kind: "work",
    durationSec: 0,
    restSec: ex.defaultRestSec,
    reps: ex.defaultSets,
    exerciseName: ex.name,
    targetReps: ex.defaultReps,
    targetWeightKg: ex.defaultWeightKg,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    libraryId: ex.id,
    notes: ex.hint,
    ...overrides,
  };
}

export function blueprintToSeries(bp: ProgramBlueprint): Series[] {
  return bp.exerciseIds
    .map((id) => getExercise(id))
    .filter((e): e is LibraryExercise => Boolean(e))
    .map((e) => {
      // 5×5 blueprint: force scheme on compound lifts
      if (bp.id === "bp_5x5") {
        return libraryToSeries(e, {
          reps: 5,
          targetReps: 5,
          restSec: 180,
          targetRpe: 8,
        });
      }
      return libraryToSeries(e);
    });
}

export function alternativesFor(ser: Series): LibraryExercise[] {
  const fromLib = ser.libraryId ? getExercise(ser.libraryId) : undefined;
  const altIds = fromLib?.alternatives ?? [];
  const alts = altIds
    .map((id) => getExercise(id))
    .filter((e): e is LibraryExercise => Boolean(e));

  if (alts.length > 0) return alts;

  // Fallback: same muscle group, different exercise
  if (ser.muscleGroup) {
    return EXERCISE_LIBRARY.filter(
      (e) =>
        e.muscleGroup === ser.muscleGroup &&
        e.id !== ser.libraryId &&
        e.name !== ser.exerciseName,
    ).slice(0, 4);
  }
  return [];
}

export function swapSeriesExercise(ser: Series, next: LibraryExercise): Series {
  return {
    ...ser,
    exerciseName: next.name,
    libraryId: next.id,
    muscleGroup: next.muscleGroup,
    equipment: next.equipment,
    notes: next.hint ?? ser.notes,
    // Keep user's sets/reps/weight/rest unless empty
    targetWeightKg: ser.targetWeightKg ?? next.defaultWeightKg,
    targetReps: ser.targetReps ?? next.defaultReps,
    restSec: ser.restSec || next.defaultRestSec,
    reps: ser.reps || next.defaultSets,
  };
}

export function applyRepScheme(series: Series[], scheme: RepScheme): Series[] {
  return series.map((s) => ({
    ...s,
    reps: scheme.sets,
    targetReps: scheme.reps,
    restSec: scheme.restSec,
    targetRpe: scheme.rpe ?? s.targetRpe,
  }));
}

/** ~45s effort per set + rest between sets (not after last) */
export function estimateProgramSeconds(series: Series[]): number {
  let total = 0;
  for (const s of series) {
    const effort = 45 * s.reps;
    const rests = Math.max(0, s.reps - 1) * s.restSec;
    total += effort + rests;
  }
  return total;
}

export function programStats(series: Series[]) {
  const totalSets = series.reduce((n, s) => n + s.reps, 0);
  const totalExercises = series.length;
  const estSec = estimateProgramSeconds(series);
  const tonnage = series.reduce((n, s) => {
    if (s.targetWeightKg == null || s.targetReps == null) return n;
    return n + s.targetWeightKg * s.targetReps * s.reps;
  }, 0);
  const byMuscle: Partial<Record<MuscleGroup, number>> = {};
  for (const s of series) {
    const m = s.muscleGroup ?? "full";
    byMuscle[m] = (byMuscle[m] ?? 0) + s.reps;
  }
  return { totalSets, totalExercises, estSec, tonnage, byMuscle };
}

export function suggestProgression(
  lastWeightKg: number | undefined,
  lastReps: number | undefined,
  targetReps: number,
  stepKg = 2.5,
): { weightKg?: number; note: string } {
  if (lastWeightKg == null) {
    return { note: "Ingen historikk — start konservativt" };
  }
  if (lastReps != null && lastReps >= targetReps) {
    const next = Math.round((lastWeightKg + stepKg) * 2) / 2;
    return {
      weightKg: next,
      note: `Forrige: ${lastWeightKg} kg × ${lastReps} — prøv ${next} kg`,
    };
  }
  return {
    weightKg: lastWeightKg,
    note: `Forrige: ${lastWeightKg} kg${lastReps != null ? ` × ${lastReps}` : ""} — hold vekten`,
  };
}
