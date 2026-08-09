import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  ENV_LABEL,
  SPORT_LABEL,
  countDrags,
  formatDurationLong,
  formatMmSs,
  totalTemplateSeconds,
} from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";
import { cn } from "@/lib/utils";

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
        <div className="space-y-4 py-8 text-center">
          <p className="font-display text-xl">Fant ikke malen.</p>
          <Button asChild variant="outline">
            <Link to="/">← Økter</Link>
          </Button>
        </div>
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
  const sportTone =
    template.sport === "strength"
      ? "text-strength"
      : template.sport === "mobility"
        ? "text-mobility"
        : "text-running";

  const lastCompleted = sessions
    .filter((s) => s.status === "completed" && s.templateId === template.id)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];

  return (
    <AppShell active="home" hideNav>
      <div className="flex min-h-[70dvh] flex-col space-y-3.5">
        <Link to="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
          ← Økter
        </Link>

        <header className="space-y-1">
          <p className={cn("label-caps", sportTone)}>
            {SPORT_LABEL[template.sport]} · {ENV_LABEL[template.environment]}
          </p>
          <h1 className="font-display text-[26px] leading-tight">{template.name}</h1>
          <p className="text-[13px] tabular text-muted-foreground">
            {lastCompleted?.completedAt
              ? `Sist fullført ${new Date(lastCompleted.completedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long" })} · ${formatDurationLong(Math.round(((lastCompleted.completedAt ?? 0) - lastCompleted.startedAt) / 1000))}`
              : template.sport === "strength"
                ? `${template.series.length} øvelser · ${countDrags(template.series)} sett · ca. ${formatDurationLong(total)}`
                : `${countDrags(template.series)} drag · ca. ${formatDurationLong(total)}`}
          </p>
        </header>

        <div className="rounded-[20px] border border-border bg-card px-4 py-1">
          {template.series.map((ser, i) => (
            <div
              key={ser.id}
              className={cn(
                "flex items-center justify-between gap-3 py-3",
                i < template.series.length - 1 && "border-b border-border",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {template.sport === "strength"
                    ? ser.exerciseName || `Øvelse ${i + 1}`
                    : `Serie ${i + 1}`}
                </p>
                <p className="text-xs tabular text-muted-foreground">
                  {template.sport === "strength"
                    ? `${ser.reps}×${ser.targetReps ?? 8}${ser.targetWeightKg != null ? ` @ ${ser.targetWeightKg} kg` : ""}`
                    : `${ser.reps} × ${formatMmSs(ser.durationSec)}`}
                </p>
              </div>
              <p className="shrink-0 text-[13px] tabular text-muted-foreground">
                {template.sport === "strength"
                  ? `${ser.reps} sett`
                  : formatMmSs(ser.durationSec)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <Button
            size="lg"
            variant={template.sport === "strength" ? "strength" : "default"}
            className="w-full rounded-[14px]"
            onClick={begin}
          >
            {resumeSame ? "Fortsett økt" : "Start økt"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
