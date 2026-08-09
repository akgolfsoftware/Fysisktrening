import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatTile } from "@/components/ui/card";
import { ENV_LABEL, SPORT_LABEL, formatDurationLong } from "@/lib/intervall/format";
import type { Sport } from "@/lib/intervall/types";
import { useIntervallStore } from "@/lib/intervall/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({ component: HistoryPage });

const bar: Record<Sport, string> = {
  running: "bg-running",
  strength: "bg-strength",
  mobility: "bg-mobility",
};

function HistoryPage() {
  const allSessions = useIntervallStore((s) => s.sessions);
  const sessions = useMemo(
    () =>
      allSessions
        .filter((x) => x.status === "completed" || x.status === "aborted")
        .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt)),
    [allSessions],
  );

  const completed = sessions.filter((s) => s.status === "completed");

  const weekStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    let count = 0;
    let sec = 0;
    for (const s of completed) {
      const t = s.completedAt ?? s.startedAt;
      if (t >= start.getTime()) {
        count += 1;
        sec += Math.max(0, Math.round(((s.completedAt ?? Date.now()) - s.startedAt) / 1000));
      }
    }
    return { count, sec };
  }, [completed]);

  return (
    <AppShell active="history">
      <div className="space-y-3.5">
        <header className="space-y-3">
          <h1 className="font-display text-[28px] leading-tight">Historikk</h1>
          <div className="flex gap-2.5">
            <StatTile label="Denne uken" value={`${weekStats.count} økter`} />
            <StatTile
              label="Tid"
              value={
                weekStats.sec >= 3600
                  ? `${Math.floor(weekStats.sec / 3600)}t ${Math.floor((weekStats.sec % 3600) / 60)}m`
                  : `${Math.floor(weekStats.sec / 60)}m`
              }
            />
          </div>
        </header>

        {sessions.length === 0 ? (
          <div className="rounded-[22px] border border-border bg-background px-6 py-12 text-center">
            <p className="font-display text-xl">Ingen fullførte økter</p>
            <p className="mx-auto mt-2 max-w-[30ch] text-[13.5px] text-muted-foreground">
              Historikken fylles av seg selv når du fullfører den første.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((s) => {
              const durationSec = Math.max(
                0,
                Math.round(((s.completedAt ?? Date.now()) - s.startedAt) / 1000),
              );
              const mins = Math.max(1, Math.round(durationSec / 60));
              return (
                <Link
                  key={s.id}
                  to="/history/$id"
                  params={{ id: s.id }}
                  className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-border bg-card px-[15px] py-3.5 shadow-[var(--shadow-soft)]"
                >
                  <div className={cn("w-1 self-stretch rounded-sm", bar[s.sport])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15.5px] font-semibold">{s.templateName}</p>
                    <p className="text-[12.5px] tabular text-muted-foreground">
                      {new Date(s.completedAt ?? s.startedAt).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {SPORT_LABEL[s.sport]} · {ENV_LABEL[s.environment]}
                      {s.status === "aborted" ? " · avbrutt" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-[19px] tabular text-primary">
                    {mins}m
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
