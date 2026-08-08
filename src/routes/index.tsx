import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { TemplateCard } from "@/components/workout/TemplateCard";
import { SPORT_LABEL } from "@/lib/intervall/format";
import { useIntervallStore } from "@/lib/intervall/store";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const templates = useIntervallStore((s) => s.templates);
  const sessions = useIntervallStore((s) => s.sessions);
  const filter = useIntervallStore((s) => s.filter);
  const setFilter = useIntervallStore((s) => s.setFilter);

  const completed = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "completed")
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [sessions],
  );

  const active = useMemo(
    () => sessions.find((s) => s.status === "active"),
    [sessions],
  );

  const filtered = useMemo(() => {
    const list = [...templates].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter === "all") return list;
    return list.filter((t) => t.sport === filter);
  }, [templates, filter]);

  const recommendation = useMemo(() => {
    if (templates.length === 0) return null;
    const last = completed[0];
    if (!last) {
      return templates.find((t) => t.sport === "running") ?? templates[0]!;
    }
    const nextSport =
      last.sport === "running"
        ? "strength"
        : last.sport === "strength"
          ? "mobility"
          : "running";
    return (
      templates.find((t) => t.sport === nextSport) ??
      templates.find((t) => t.id !== last.templateId) ??
      templates[0]!
    );
  }, [templates, completed]);

  return (
    <AppShell active="home">
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/20 via-background to-strength/15">
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 text-primary">
                  <LogoMark />
                  <span className="font-display text-3xl font-medium text-foreground">
                    Intervall
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Løping, styrke og bevegelighet — klart for økt
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-medium">Dine økter</h1>
              <p className="text-sm text-muted-foreground">
                {templates.length} maler · {completed.length} fullført
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/templates/new">
                <Plus /> Ny økt
              </Link>
            </Button>
          </div>
        </header>

        {active && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Pågående økt
                </p>
                <p className="font-display text-lg">{active.templateName}</p>
              </div>
              <Button asChild size="sm">
                <Link to="/session/$id" params={{ id: active.id }}>
                  Fortsett
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {recommendation && (
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Anbefaling
                </p>
                <p className="font-display text-lg leading-snug">{recommendation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {completed[0]
                    ? `Etter ${SPORT_LABEL[completed[0].sport].toLowerCase()} — prøv ${SPORT_LABEL[recommendation.sport].toLowerCase()}`
                    : "Start med en bevist mal fra startpakken"}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/templates/$id/start" params={{ id: recommendation.id }}>
                    Start
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Alle" },
            { value: "running", label: "Løp" },
            { value: "strength", label: "Styrke" },
            { value: "mobility", label: "Beveg." },
          ]}
        />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyWorkouts />
          ) : (
            filtered.map((t) => <TemplateCard key={t.id} template={t} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyWorkouts() {
  return (
    <Card>
      <CardContent className="space-y-3 py-10 text-center">
        <p className="font-display text-xl">Ingen økter her ennå</p>
        <p className="text-sm text-muted-foreground">
          Lag din første mal, eller bytt filter for å se startpakken.
        </p>
        <Button asChild>
          <Link to="/templates/new">
            <Plus /> Ny økt
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-8" role="img" aria-label="Intervall">
      <path d="M35.8 8.6l3 3" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="24" cy="26" r="16" stroke="currentColor" strokeWidth="3.4" />
      <path
        d="M17 32.5V22M22.3 34V17M27.7 34V17M33 32.5V22"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
