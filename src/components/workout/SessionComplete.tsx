import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/card";
import { formatDurationLong, formatMmSs } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";
import type { Session, SessionFeeling } from "@/lib/intervall/types";
import { cn } from "@/lib/utils";

const feelingLabel: Record<SessionFeeling, string> = {
  easy: "Lett",
  ok: "Passe",
  hard: "Tungt",
};

export function SessionComplete({ session }: { session: Session }) {
  const navigate = useNavigate();
  const updateSession = useIntervallStore((s) => s.updateSession);
  const abortSession = useIntervallStore((s) => s.abortSession);
  const [feeling, setFeeling] = useState<SessionFeeling | undefined>(session.feeling);

  const durationSec = Math.max(
    0,
    Math.round(((session.completedAt ?? Date.now()) - session.startedAt) / 1000),
  );

  const workPhases = useMemo(
    () => session.phases.filter((p) => p.kind === "work"),
    [session.phases],
  );

  const byExercise = useMemo(() => {
    const map = new Map<string, { name: string; chips: string[]; top?: number }>();
    for (const p of workPhases) {
      const name = p.exerciseName || p.label;
      const log = session.setLogs?.[p.id];
      const w = log?.weightKg ?? p.targetWeightKg;
      const r = log?.reps ?? p.targetReps;
      const chip =
        session.sport === "strength" ? String(r ?? "—") : formatMmSs(p.durationSec);
      const prev = map.get(name) ?? { name, chips: [] };
      prev.chips.push(chip);
      if (w != null && (prev.top == null || w > prev.top)) prev.top = w;
      map.set(name, prev);
    }
    return [...map.values()];
  }, [session, workPhases]);

  const tonnage = useMemo(() => {
    if (session.sport !== "strength") return null;
    let t = 0;
    for (const p of workPhases) {
      const log = session.setLogs?.[p.id];
      t += (log?.weightKg ?? p.targetWeightKg ?? 0) * (log?.reps ?? p.targetReps ?? 0);
    }
    return t;
  }, [session, workPhases]);

  const avgRpe = useMemo(() => {
    const vals = workPhases.map((p) => p.targetRpe).filter((x): x is number => x != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [workPhases]);

  const insight = useMemo(() => {
    if (session.sport === "strength" && byExercise.length) {
      const heaviest = [...byExercise].sort((a, b) => (b.top ?? 0) - (a.top ?? 0))[0];
      if (heaviest?.top) {
        const next = Math.round(heaviest.top / 2.5) * 2.5 + 2.5;
        return `Topp ${heaviest.name.toLowerCase()} ${String(heaviest.top).replace(".", ",")} kg. Neste økt foreslås på ${String(next).replace(".", ",")} kg.`;
      }
      return "Bra jobba. Lasten er lagret for neste gang.";
    }
    const mins = Math.max(1, Math.round(durationSec / 60));
    return `Økten tok ${mins} min. Historikken er oppdatert.`;
  }, [session.sport, byExercise, durationSec]);

  const startLabel = new Date(session.startedAt).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endLabel = new Date(session.completedAt ?? Date.now()).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function pickFeeling(f: SessionFeeling) {
    setFeeling(f);
    updateSession(session.id, { feeling: f });
  }

  function discard() {
    abortSession(session.id);
    void navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-[75dvh] flex-col">
      <div className="flex-1 space-y-3.5 pb-4">
        <header className="space-y-1.5">
          <p className="label-caps text-strength">
            Fullført {startLabel}–{endLabel}
          </p>
          <h1 className="font-display text-[30px] leading-tight tracking-tight">
            {session.templateName}
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
            {insight}
          </p>
        </header>

        <div className="flex gap-2.5">
          <StatTile
            label="Varighet"
            value={
              durationSec >= 3600
                ? formatDurationLong(durationSec)
                : `${Math.max(1, Math.round(durationSec / 60))}m`
            }
          />
          {session.sport === "strength" ? (
            <>
              <StatTile
                label="Tonnasje"
                value={
                  tonnage != null
                    ? tonnage >= 1000
                      ? `${(tonnage / 1000).toFixed(1).replace(".", ",")}t`
                      : `${Math.round(tonnage)} kg`
                    : "—"
                }
              />
              <StatTile
                label="Snitt RPE"
                value={avgRpe != null ? avgRpe.toFixed(1).replace(".", ",") : "—"}
              />
            </>
          ) : (
            <>
              <StatTile label="Drag" value={String(workPhases.length)} />
              <StatTile label="Status" value="Fullført" />
            </>
          )}
        </div>

        <div className="rounded-[20px] border border-border bg-card px-4">
          {byExercise.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Ingen faser logget.</p>
          ) : (
            byExercise.map((ex, i) => (
              <div
                key={ex.name}
                className={cn(
                  "flex items-center gap-3 py-3",
                  i < byExercise.length - 1 && "border-b border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold">{ex.name}</p>
                  {ex.top != null && (
                    <p className="text-xs tabular text-muted-foreground">
                      Topp {String(ex.top).replace(".", ",")} kg
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {ex.chips.map((c, j) => (
                    <span
                      key={j}
                      className="flex h-[26px] min-w-[26px] items-center justify-center rounded-[7px] bg-muted px-1.5 font-mono text-[11.5px] text-primary"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Hvordan kjentes økten?</p>
          <div className="flex gap-2">
            {(["easy", "ok", "hard"] as const).map((f) => {
              const active = feeling === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => pickFeeling(f)}
                  className={cn(
                    "min-h-11 flex-1 rounded-[11px] border px-2 py-2.5 text-[13.5px] transition-colors",
                    active
                      ? "border-primary bg-primary font-semibold text-primary-foreground"
                      : "border-border-strong text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {feelingLabel[f]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="nav-blur sticky bottom-0 -mx-4 space-y-2.5 border-t border-border px-5 pb-7 pt-3">
        <Button
          size="lg"
          className="w-full rounded-[14px]"
          onClick={() => void navigate({ to: "/" })}
        >
          Lagre i historikk
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="min-h-11 flex-1 rounded-[14px]">
            <Link to="/history/$id" params={{ id: session.id }}>
              Se detaljer
            </Link>
          </Button>
          <button
            type="button"
            onClick={discard}
            className="min-h-11 flex-1 text-sm text-muted-foreground"
          >
            Forkast økten
          </button>
        </div>
      </div>
    </div>
  );
}
