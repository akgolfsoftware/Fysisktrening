import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ENV_LABEL, SPORT_LABEL, formatDurationLong } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const allSessions = useIntervallStore((s) => s.sessions);
  const sessions = useMemo(
    () =>
      allSessions
        .filter((x) => x.status === "completed" || x.status === "aborted")
        .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt)),
    [allSessions],
  );

  return (
    <AppShell active="history">
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-medium">Historikk</h1>
          <p className="text-sm text-muted-foreground">
            {sessions.filter((s) => s.status === "completed").length} økter gjennomført
          </p>
        </header>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-12 text-center">
              <p className="font-display text-xl">Ingen økter ennå</p>
              <p className="text-sm text-muted-foreground">
                Fullfør en økt for å se den her. Data lagres lokalt på enheten.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const durationSec = Math.max(
                0,
                Math.round(((s.completedAt ?? Date.now()) - s.startedAt) / 1000),
              );
              return (
                <Link key={s.id} to="/history/$id" params={{ id: s.id }} className="block">
                  <Card className="transition-colors hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              s.sport === "strength"
                                ? "strength"
                                : s.sport === "mobility"
                                  ? "mobility"
                                  : "running"
                            }
                          >
                            {SPORT_LABEL[s.sport]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ENV_LABEL[s.environment]}
                          </span>
                          {s.status === "aborted" && (
                            <span className="text-xs text-destructive">Avbrutt</span>
                          )}
                        </div>
                        <p className="truncate font-display text-lg">{s.templateName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.completedAt ?? s.startedAt).toLocaleString("nb-NO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <p className="shrink-0 tabular text-sm text-muted-foreground">
                        {formatDurationLong(durationSec)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
