import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import { SEED_TEMPLATES } from "./seeds";
import { buildTimeline, exerciseLogKey } from "./timeline";
import { OLYMPIATOPPEN_ZONE_LOW } from "./zones";
import type { ExerciseLog, Session, Settings, Template } from "./types";

type FilterSport = "all" | Template["sport"];

type State = {
  templates: Template[];
  sessions: Session[];
  settings: Settings;
  exerciseLogs: Record<string, ExerciseLog>;
  hydrated: boolean;
  filter: FilterSport;
  setHydrated: (v: boolean) => void;
  setFilter: (f: FilterSport) => void;
  upsertTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => Template | null;
  getTemplate: (id: string) => Template | undefined;
  updateSettings: (partial: Partial<Settings>) => void;
  startSession: (templateId: string) => Session | null;
  updateSession: (id: string, partial: Partial<Session>) => void;
  logSet: (
    sessionId: string,
    phaseId: string,
    log: { weightKg?: number; reps?: number },
  ) => void;
  completeSession: (id: string) => void;
  abortSession: (id: string) => void;
  getSession: (id: string) => Session | undefined;
  getActiveSession: () => Session | undefined;
  completedSessions: () => Session[];
  getExerciseLog: (key: string) => ExerciseLog | undefined;
  resetSeeds: () => void;
};

const defaultSettings: Settings = {
  maxHr: 190,
  speedUnit: "kmh",
  soundEnabled: true,
  customZones: false,
  zoneLowPct: [...OLYMPIATOPPEN_ZONE_LOW],
  defaultStrengthRestSec: 90,
  weightStepKg: 2.5,
};

function mergeMissingSeeds(templates: Template[]): Template[] {
  const ids = new Set(templates.map((t) => t.id));
  const missing = SEED_TEMPLATES.filter((t) => !ids.has(t.id));
  return missing.length ? [...templates, ...missing] : templates;
}

export const useIntervallStore = create<State>()(
  persist(
    (set, get) => ({
      templates: SEED_TEMPLATES,
      sessions: [],
      settings: defaultSettings,
      exerciseLogs: {},
      hydrated: false,
      filter: "all",
      setHydrated: (v) => set({ hydrated: v }),
      setFilter: (f) => set({ filter: f }),
      upsertTemplate: (t) =>
        set((s) => {
          const exists = s.templates.some((x) => x.id === t.id);
          return {
            templates: exists
              ? s.templates.map((x) => (x.id === t.id ? t : x))
              : [t, ...s.templates],
          };
        }),
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      duplicateTemplate: (id) => {
        const src = get().templates.find((t) => t.id === id);
        if (!src) return null;
        const copy: Template = {
          ...src,
          id: uid("tpl"),
          name: `${src.name} (kopi)`,
          isSeed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          series: src.series.map((ser) => ({ ...ser, id: uid("ser") })),
        };
        get().upsertTemplate(copy);
        return copy;
      },
      getTemplate: (id) => get().templates.find((t) => t.id === id),
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      startSession: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template || template.series.length === 0) return null;

        // Apply progression suggestions for strength
        let series = template.series;
        if (template.sport === "strength") {
          const logs = get().exerciseLogs;
          const step = get().settings.weightStepKg;
          series = template.series.map((ser) => {
            const key = exerciseLogKey(ser);
            const log = logs[key];
            if (!log?.weightKg) return ser;
            const hitTarget =
              log.reps != null &&
              ser.targetReps != null &&
              log.reps >= ser.targetReps;
            const suggested = hitTarget
              ? Math.round((log.weightKg + step) * 2) / 2
              : log.weightKg;
            return {
              ...ser,
              targetWeightKg: suggested,
            };
          });
        }

        const phases = buildTimeline({ ...template, series });
        if (phases.length === 0) return null;
        const first = phases[0]!;
        const session: Session = {
          id: uid("ses"),
          templateId: template.id,
          templateName: template.name,
          sport: template.sport,
          environment: template.environment,
          status: "active",
          startedAt: Date.now(),
          phases,
          phaseIndex: 0,
          remainingSec: first.manual ? 0 : first.durationSec,
          completedSets: 0,
          setLogs: {},
        };
        set((s) => ({
          sessions: [
            session,
            ...s.sessions.map((x) =>
              x.status === "active"
                ? { ...x, status: "aborted" as const, completedAt: Date.now() }
                : x,
            ),
          ],
        }));
        return session;
      },
      updateSession: (id, partial) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...partial } : x)),
        })),
      logSet: (sessionId, phaseId, log) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sessionId
              ? {
                  ...x,
                  setLogs: { ...(x.setLogs ?? {}), [phaseId]: log },
                }
              : x,
          ),
        })),
      completeSession: (id) =>
        set((s) => {
          const session = s.sessions.find((x) => x.id === id);
          const nextLogs = { ...s.exerciseLogs };

          if (session?.sport === "strength") {
            // Aggregate best/last work phase per exercise
            const byKey = new Map<
              string,
              { name: string; weightKg?: number; reps?: number; sets: number }
            >();
            for (const phase of session.phases) {
              if (phase.kind !== "work") continue;
              const key = exerciseLogKey({
                libraryId: phase.libraryId,
                exerciseName: phase.exerciseName,
              });
              const logged = session.setLogs?.[phase.id];
              const weightKg = logged?.weightKg ?? phase.targetWeightKg;
              const reps = logged?.reps ?? phase.targetReps;
              const prev = byKey.get(key);
              byKey.set(key, {
                name: phase.exerciseName || key,
                weightKg,
                reps,
                sets: (prev?.sets ?? 0) + 1,
              });
            }
            for (const [key, v] of byKey) {
              nextLogs[key] = {
                key,
                exerciseName: v.name,
                weightKg: v.weightKg,
                reps: v.reps,
                sets: v.sets,
                at: Date.now(),
              };
            }

            // Persist suggested weights back onto template for next time
            const tpl = s.templates.find((t) => t.id === session.templateId);
            if (tpl) {
              const updatedSeries = tpl.series.map((ser) => {
                const key = exerciseLogKey(ser);
                const log = nextLogs[key];
                if (!log?.weightKg) return ser;
                return { ...ser, targetWeightKg: log.weightKg };
              });
              return {
                exerciseLogs: nextLogs,
                sessions: s.sessions.map((x) =>
                  x.id === id
                    ? {
                        ...x,
                        status: "completed",
                        completedAt: Date.now(),
                        remainingSec: 0,
                      }
                    : x,
                ),
                templates: s.templates.map((t) =>
                  t.id === tpl.id
                    ? { ...t, series: updatedSeries, updatedAt: Date.now() }
                    : t,
                ),
              };
            }
          }

          return {
            exerciseLogs: nextLogs,
            sessions: s.sessions.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "completed",
                    completedAt: Date.now(),
                    remainingSec: 0,
                  }
                : x,
            ),
          };
        }),
      abortSession: (id) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id
              ? { ...x, status: "aborted", completedAt: Date.now() }
              : x,
          ),
        })),
      getSession: (id) => get().sessions.find((s) => s.id === id),
      getActiveSession: () => get().sessions.find((s) => s.status === "active"),
      completedSessions: () =>
        get()
          .sessions.filter((s) => s.status === "completed")
          .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
      getExerciseLog: (key) => get().exerciseLogs[key],
      resetSeeds: () =>
        set((s) => {
          const custom = s.templates.filter((t) => !t.isSeed);
          return { templates: [...SEED_TEMPLATES, ...custom] };
        }),
    }),
    {
      name: "iron-mile",
      partialize: (s) => ({
        templates: s.templates,
        sessions: s.sessions,
        settings: s.settings,
        exerciseLogs: s.exerciseLogs,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          templates: mergeMissingSeeds(p.templates ?? current.templates),
          sessions: p.sessions ?? current.sessions,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          exerciseLogs: p.exerciseLogs ?? current.exerciseLogs,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const merged = mergeMissingSeeds(state.templates);
        if (merged !== state.templates) {
          useIntervallStore.setState({ templates: merged });
        }
        state.setHydrated(true);
      },
    },
  ),
);
