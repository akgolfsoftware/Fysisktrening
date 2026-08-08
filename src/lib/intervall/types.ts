export type Sport = "running" | "strength" | "mobility";
export type Environment = "treadmill" | "outdoor" | "gym" | "home";
export type SpeedUnit = "kmh" | "pace";
export type SessionStatus = "active" | "completed" | "aborted";

export type BlockKind = "work" | "rest" | "warmup" | "cooldown";

export type MuscleGroup = "legs" | "push" | "pull" | "core" | "full";
export type Equipment =
  | "barbell"
  | "dumbbell"
  | "bodyweight"
  | "machine"
  | "band"
  | "cable";

/** One series inside a workout template */
export type Series = {
  id: string;
  kind: BlockKind;
  /** Work/rest duration (running/mobility) or rest between sets (strength) */
  durationSec: number;
  restSec: number;
  /** Number of intervals or strength sets */
  reps: number;
  targetSpeedKmh?: number;
  targetZone?: 1 | 2 | 3 | 4 | 5;
  /** Strength / mobility exercise name */
  exerciseName?: string;
  /** Target reps per set (strength) — for plank: seconds */
  targetReps?: number;
  /** Optional load in kg */
  targetWeightKg?: number;
  /** Strength program metadata */
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  libraryId?: string;
  notes?: string;
  /** Target RPE 1–10 */
  targetRpe?: number;
};

export type Template = {
  id: string;
  name: string;
  sport: Sport;
  environment: Environment;
  series: Series[];
  isSeed?: boolean;
  /** Optional program label e.g. Push / Fullkropp */
  programTag?: string;
  createdAt: number;
  updatedAt: number;
};

export type Settings = {
  maxHr: number;
  speedUnit: SpeedUnit;
  soundEnabled: boolean;
  customZones: boolean;
  /** Lower bounds % of maxHR for zones 1–5 when custom */
  zoneLowPct: [number, number, number, number, number];
  /** Default rest between strength sets (sec) when adding exercises */
  defaultStrengthRestSec: number;
  /** Preferred progression step in kg */
  weightStepKg: number;
};

/** Last logged performance keyed by libraryId or exercise name */
export type ExerciseLog = {
  key: string;
  exerciseName: string;
  weightKg?: number;
  reps?: number;
  sets?: number;
  at: number;
};

export type TimelinePhase = {
  id: string;
  seriesId: string;
  label: string;
  kind: BlockKind;
  durationSec: number;
  setIndex: number;
  setTotal: number;
  exerciseName?: string;
  targetReps?: number;
  targetWeightKg?: number;
  targetSpeedKmh?: number;
  targetZone?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  targetRpe?: number;
  libraryId?: string;
  /** Strength work phases wait for manual complete */
  manual?: boolean;
};

export type Session = {
  id: string;
  templateId: string;
  templateName: string;
  sport: Sport;
  environment: Environment;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
  phases: TimelinePhase[];
  phaseIndex: number;
  /** Seconds remaining in current timed phase */
  remainingSec: number;
  /** For strength: sets completed count for summary */
  completedSets: number;
  /** Actual logged weight/reps per phase (strength) */
  setLogs?: Record<string, { weightKg?: number; reps?: number }>;
};
