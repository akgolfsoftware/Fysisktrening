import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { IronMileMark } from "@/components/brand/IronMileMark";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { TemplateCard } from "@/components/workout/TemplateCard";
import { BRAND } from "@/lib/brand";
import {
  countDrags,
  formatDurationLong,
  totalTemplateSeconds,
} from "@/lib/intervall/format";
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

  const recMeta = useMemo(() => {
    if (!recommendation) return "";
    const drags = countDrags(recommendation.series);
    const total = totalTemplateSeconds(recommendation.series, recommendation.sport);
    if (recommendation.sport === "strength") {
      return `${recommendation.series.length} øvelser · ${drags} sett · ca. ${formatDurationLong(total)}`;
    }
    return `${drags} drag · ca. ${formatDurationLong(total)}`;
  }, [recommendation]);

  const daysSince = useMemo(() => {
    if (!completed[0]?.completedAt) return null;
    return Math.max(
      0,
      Math.floor((Date.now() - completed[0].completedAt) / (24 * 3600 * 1000)),
    );
  }, [completed]);

  return (
    <AppShell active="home">
      <div className="space-y-3.5">
        {/* Hero — design 1b */}
        <div className="iron-hero -mx-4 space-y-3.5 px-5 pb-4 pt-2">
          <IronMileMark withWordmark size="md" />
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[27px] leading-tight">Dine økter</h1>
              <p className="text-[12.5px] tabular text-muted-foreground">
                {templates.length} maler · {completed.length} fullført
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 rounded-xl px-[18px]">
              <Link to="/templates/new">Ny økt</Link>
            </Button>
          </div>
        </div>

        {active && (
          <div className="rounded-[20px] border border-primary/25 bg-card p-4 shadow-[var(--shadow-soft)]">
            <p className="label-caps text-primary">Pågående økt</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="font-display text-[21px] leading-snug">{active.templateName}</p>
              <Button asChild size="sm" className="shrink-0">
                <Link to="/session/$id" params={{ id: active.id }}>
                  Fortsett
                </Link>
              </Button>
            </div>
          </div>
        )}

        {recommendation && !active && (
          <div className="rounded-[20px] border border-strength/30 bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-2">
              <p className="label-caps text-strength">Anbefalt i dag</p>
              {daysSince != null && (
                <p className="text-[11.5px] tabular text-muted-foreground">
                  sist: {daysSince === 0 ? "i dag" : `${daysSince} dager siden`}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[21px] leading-snug">{recommendation.name}</p>
                <p className="mt-1 text-[12.5px] tabular text-muted-foreground">{recMeta}</p>
              </div>
              <Button asChild variant="strength" size="sm" className="shrink-0 rounded-xl px-5">
                <Link to="/templates/$id/start" params={{ id: recommendation.id }}>
                  Start
                </Link>
              </Button>
            </div>
          </div>
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

        <div className="space-y-2.5">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-[22px] border border-border bg-background px-6 py-10 text-center">
              <p className="font-display text-xl">Ingen maler her</p>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                Bytt filter eller lag en ny økt.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{BRAND.name}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
