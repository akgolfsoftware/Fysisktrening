import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ENV_LABEL, SPORT_LABEL, formatDurationLong, formatMmSs } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";

export const Route = createFileRoute("/history/$id")({ component: HistoryDetailPage });

function HistoryDetailPage() {
  const { id } = Route.useParams();
  const sessions = useIntervallStore((s) => s.sessions);
  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);

  if (!session) {
    return (
      <AppShell active="history">
        <p className="text-muted-foreground">Fant ikke økten.</p>
        <Button asChild className="mt-4">
          <Link to="/history">Tilbake</Link>
        </Button>
      </AppShell>
    );
  }

  const durationSec = Math.max(
    0,
    Math.round(((session.completedAt ?? Date.now()) - session.startedAt) / 1000),
  );
  const workPhases = session.phases.filter((p) => p.kind === "work");

  return (
    <AppShell active="history">
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" aria-label="Tilbake">
            <Link to="/history">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-medium">{session.templateName}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(session.completedAt ?? session.startedAt).toLocaleString("nb-NO", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Varighet" value={formatDurationLong(durationSec)} />
          <Stat
            label="Status"
            value={session.status === "completed" ? "Fullført" : "Avbrutt"}
          />
          <Stat label="Sport" value={SPORT_LABEL[session.sport]} />
          <Stat label="Miljø" value={ENV_LABEL[session.environment]} />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg">Faser</h2>
          <div className="space-y-2">
            {workPhases.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {p.exerciseName || p.label}
                      {p.setTotal > 1 ? ` · ${p.setIndex}/${p.setTotal}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.manual
                        ? `${p.targetReps ?? "—"} reps${p.targetWeightKg ? ` · ${p.targetWeightKg} kg` : ""}`
                        : formatMmSs(p.durationSec)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      session.sport === "strength"
                        ? "strength"
                        : session.sport === "mobility"
                          ? "mobility"
                          : "running"
                    }
                  >
                    {p.kind === "work" ? "Arbeid" : p.kind}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {session.status === "completed" && (
          <Button asChild className="w-full" size="lg">
            <Link to="/templates/$id/start" params={{ id: session.templateId }}>
              Kjør igjen
            </Link>
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-lg">{value}</p>
      </CardContent>
    </Card>
  );
}
