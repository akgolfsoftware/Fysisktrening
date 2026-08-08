import type { Environment, Sport, SpeedUnit } from "./types";

export function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function formatDurationLong(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}t ${m}m`;
  if (m > 0) return `${m} min ${r.toString().padStart(2, "0")} s`;
  return `${r} s`;
}

export function parseMmSs(min: number, sec: number): number {
  return Math.max(0, Math.floor(min) * 60 + Math.floor(sec));
}

export function splitMmSs(totalSec: number): { min: number; sec: number } {
  const s = Math.max(0, Math.floor(totalSec));
  return { min: Math.floor(s / 60), sec: s % 60 };
}

/** km/h ↔ min/km */
export function formatSpeed(kmh: number | undefined, unit: SpeedUnit): string {
  if (kmh == null || kmh <= 0) return "—";
  if (unit === "kmh") return `${kmh.toFixed(1)} km/t`;
  const pace = 60 / kmh;
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

export const SPORT_LABEL: Record<Sport, string> = {
  running: "Løping",
  strength: "Styrke",
  mobility: "Bevegelighet",
};

export const ENV_LABEL: Record<Environment, string> = {
  treadmill: "Mølle",
  outdoor: "Ute",
  gym: "Gym",
  home: "Hjemme",
};

export function totalTemplateSeconds(series: { durationSec: number; restSec: number; reps: number; kind: string }[], sport: Sport): number {
  return series.reduce((sum, s) => {
    if (sport === "strength") {
      // estimate: 45s work + rest between sets (last set no rest counted lightly)
      const work = s.reps * 45;
      const rest = Math.max(0, s.reps - 1) * s.restSec;
      return sum + work + rest;
    }
    const work = s.reps * s.durationSec;
    const rest = Math.max(0, s.reps - (s.kind === "work" ? 0 : 0)) * s.restSec;
    // classic: rest after each rep including last optional — match original: rest after each drag
    const restTotal = s.reps * s.restSec;
    return sum + work + restTotal;
  }, 0);
}

export function countDrags(series: { reps: number }[]): number {
  return series.reduce((n, s) => n + s.reps, 0);
}
