import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ENV_LABEL,
  SPORT_LABEL,
  countDrags,
  formatDurationLong,
  formatMmSs,
  totalTemplateSeconds,
} from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";

export const Route = createFileRoute("/templates/$id/start")({ component: StartTemplatePage });

function StartTemplatePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const templates = useIntervallStore((s) => s.templates);
  const sessions = useIntervallStore((s) => s.sessions);
  const startSession = useIntervallStore((s) => s.startSession);

  const template = useMemo(() => templates.find((t) => t.id === id), [templates, id]);
  const active = useMemo(
    () => sessions.find((s) => s.status === "active"),
    [sessions],
  );

  if (!template) {
    return (
      <AppShell active="home" hideNav>
        <p className="text-muted-foreground">Fant ikke malen.</p>
        <Button asChild className="mt-4">
          <Link to="/">Tilbake</Link>
        </Button>
      </AppShell>
    );
  }

  function begin() {
    if (active && active.templateId === template!.id) {
      void navigate({ to: "/session/$id", params: { id: active.id } });
      return;
    }
    const session = startSession(template!.id);
    if (session) void navigate({ to: "/session/$id", params: { id: session.id } });
  }

  const total = totalTemplateSeconds(template.series, template.sport);
  const resumeSame = active && active.templateId === template.id;

  return (
    <AppShell active="home" hideNav>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" aria-label="Tilbake">
            <Link to="/">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  template.sport === "strength"
                    ? "strength"
                    : template.sport === "mobility"
                      ? "mobility"
                      : "running"
                }
              >
                {SPORT_LABEL[template.sport]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {ENV_LABEL[template.environment]}
              </span>
            </div>
            <h1 className="font-display text-2xl font-medium">{template.name}</h1>
          </div>
        </header>

        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="text-sm text-muted-foreground">
              {template.sport === "strength"
                ? `${template.series.length} øvelser · ${countDrags(template.series)} sett`
                : `${countDrags(template.series)} drag · ca. ${formatDurationLong(total)}`}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="font-display text-lg">Oversikt</h2>
          {template.series.map((ser, i) => (
            <Card key={ser.id}>
              <CardContent className="py-3">
                <p className="font-medium">
                  {template.sport === "strength"
                    ? ser.exerciseName || `Øvelse ${i + 1}`
                    : `Serie ${i + 1}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {template.sport === "strength"
                    ? `${ser.reps} × ${ser.targetReps ?? 8} reps${ser.targetWeightKg ? ` @ ${ser.targetWeightKg} kg` : ""} · pause ${formatMmSs(ser.restSec)}`
                    : `${ser.reps} × ${formatMmSs(ser.durationSec)} · pause ${formatMmSs(ser.restSec)}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button size="lg" className="h-14 w-full text-base" onClick={begin}>
          <Play className="fill-current" />
          {resumeSame ? "Fortsett økt" : "Start økt"}
        </Button>
      </div>
    </AppShell>
  );
}
