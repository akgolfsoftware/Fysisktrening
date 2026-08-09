import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/card";
import { ENV_LABEL, SPORT_LABEL, formatDurationLong, formatMmSs } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history/$id")({ component: HistoryDetailPage });

function HistoryDetailPage() {
  const { id } = Route.useParams();
  const sessions = useIntervallStore((s) => s.sessions);
  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);

  const workPhases = useMemo(
    () => session?.phases.filter((p) => p.kind === "work") ?? [],
    [session],
  );

  const byExercise = useMemo(() => {
    if (!session) return [];
    const map = new Map<string, { name: string; sets: string[]; top?: string }>();
    for (const p of workPhases) {
      const name = p.exerciseName || p.label;
      const log = session.setLogs?.[p.id];
      const w = log?.weightKg ?? p.targetWeightKg;
      const r = log?.reps ?? p.targetReps;
      const chip =
        session.sport === "strength"
          ? `${r ?? "—"}×${w != null ? String(w).replace(".", ",") : "—"}`
          : formatMmSs(p.durationSec);
      const prev = map.get(name) ?? { name, sets: [] };
      prev.sets.push(chip);
      if (w != null) {
        const top = prev.top ? Number(prev.top) : 0;
        if (w >= top) prev.top = String(w);
      }
      map.set(name, prev);
    }
    return [...map.values()];
  }, [session, workPhases]);

  const tonnage = useMemo(() => {
    if (!session || session.sport !== "strength") return null;
    let t = 0;
    for (const p of workPhases) {
      const log = session.setLogs?.[p.id];
      const w = log?.weightKg ?? p.targetWeightKg ?? 0;
      const r = log?.reps ?? p.targetReps ?? 0;
      t += w * r;
    }
    return t;
  }, [session, workPhases]);

  const avgRpe = useMemo(() => {
    const vals = workPhases.map((p) => p.targetRpe).filter((x): x is number => x != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [workPhases]);

  if (!session) {
    return (
      <AppShell active="history">
        <div className="space-y-4 py-8 text-center">
          <p className="font-display text-xl">Fant ikke økten.</p>
          <Button asChild variant="outline">
            <Link to="/history">← Historikk</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const durationSec = Math.max(
    0,
    Math.round(((session.completedAt ?? Date.now()) - session.startedAt) / 1000),
  );

  const sportTone =
    session.sport === "strength"
      ? "text-strength"
      : session.sport === "mobility"
        ? "text-mobility"
        : "text-running";

  return (
    <AppShell active="history" hideNav>
      <div className="space-y-3.5">
        <Link
          to="/history"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
        >
          ← Historikk
        </Link>

        <header className="space-y-1">
          <p className={cn("label-caps", sportTone)}>
            {SPORT_LABEL[session.sport]} · {ENV_LABEL[session.environment]}
          </p>
          <h1 className="font-display text-[26px] leading-tight">{session.templateName}</h1>
          <p className="text-[12.5px] tabular text-muted-foreground">
            {new Date(session.completedAt ?? session.startedAt).toLocaleString("nb-NO", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            · {formatDurationLong(durationSec)}
            {session.status === "aborted" ? " · avbrutt" : ""}
          </p>
        </header>

        <div className="flex gap-2.5">
          {session.sport === "strength" ? (
            <>
              <StatTile
                label="Sett"
                value={`${session.completedSets || workPhases.length}/${workPhases.length}`}
              />
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
              <StatTile label="Varighet" value={formatDurationLong(durationSec)} />
              <StatTile label="Drag" value={String(workPhases.length)} />
              <StatTile
                label="Status"
                value={session.status === "completed" ? "Fullført" : "Avbrutt"}
              />
            </>
          )}
        </div>

        <div className="rounded-[20px] border border-border bg-card px-4 pb-1.5 pt-3.5">
          <p className="mb-2.5 text-[15px] font-semibold">
            {session.sport === "strength" ? "Sett-logg" : "Faser"}
          </p>
          {session.sport === "strength"
            ? byExercise.map((ex, i) => (
                <div
                  key={ex.name}
                  className={cn(
                    "flex flex-col gap-1.5 py-2.5",
                    i < byExercise.length - 1 && "border-b border-border",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{ex.name}</p>
                    {ex.top && (
                      <p className="shrink-0 text-xs tabular text-muted-foreground">
                        Topp {ex.top.replace(".", ",")} kg
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.sets.map((chip, j) => (
                      <span
                        key={j}
                        className="min-w-12 flex-1 rounded-lg bg-background py-1.5 text-center font-mono text-[11.5px] text-primary"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            : workPhases.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between py-2.5",
                    i < workPhases.length - 1 && "border-b border-border",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {p.exerciseName || p.label}
                      {p.setTotal > 1 ? ` · ${p.setIndex}/${p.setTotal}` : ""}
                    </p>
                    {p.targetZone && (
                      <p className="text-xs text-muted-foreground">Sone {p.targetZone}</p>
                    )}
                  </div>
                  <p className="font-mono text-sm tabular text-primary">
                    {formatMmSs(p.durationSec)}
                  </p>
                </div>
              ))}
        </div>

        {session.status === "completed" && (
          <Button asChild size="lg" className="w-full rounded-[14px]">
            <Link to="/templates/$id/start" params={{ id: session.templateId }}>
              Kjør igjen
            </Link>
          </Button>
        )}
      </div>
    </AppShell>
  );
}
