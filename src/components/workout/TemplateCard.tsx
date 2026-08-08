import { Link } from "@tanstack/react-router";
import { Copy, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ENV_LABEL,
  SPORT_LABEL,
  countDrags,
  formatDurationLong,
  totalTemplateSeconds,
} from "@/lib/intervall/format";
import type { Template } from "@/lib/intervall/types";
import { useIntervallStore } from "@/lib/intervall/store";
import { cn } from "@/lib/utils";

const sportBadge = {
  running: "running",
  strength: "strength",
  mobility: "mobility",
} as const;

export function TemplateCard({ template }: { template: Template }) {
  const deleteTemplate = useIntervallStore((s) => s.deleteTemplate);
  const duplicateTemplate = useIntervallStore((s) => s.duplicateTemplate);
  const [menu, setMenu] = useState(false);
  const total = totalTemplateSeconds(template.series, template.sport);
  const drags = countDrags(template.series);
  const subtitle =
    template.sport === "strength"
      ? `${template.series.length} øvelser · ${drags} sett`
      : `${drags} drag · ~${formatDurationLong(total)}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch gap-0">
          <Link
            to="/templates/$id/start"
            params={{ id: template.id }}
            className="flex min-w-0 flex-1 flex-col gap-2 p-4 pr-2 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={sportBadge[template.sport]}>{SPORT_LABEL[template.sport]}</Badge>
              <span className="text-xs text-muted-foreground">{ENV_LABEL[template.environment]}</span>
              {template.programTag && (
                <Badge variant="secondary">{template.programTag}</Badge>
              )}
              {template.isSeed && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Startpakke
                </span>
              )}
            </div>
            <div>
              <h3 className="font-display text-lg font-medium leading-snug">{template.name}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {template.sport === "strength" && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {template.series.map((s) => s.exerciseName || "Øvelse").join(" · ")}
              </p>
            )}
          </Link>
          <div className="flex flex-col items-center justify-center gap-1 border-l border-border p-2">
            <Button asChild size="icon" className="size-11 rounded-xl" aria-label="Start økt">
              <Link to="/templates/$id/start" params={{ id: template.id }}>
                <Play className="size-4 fill-current" />
              </Link>
            </Button>
            <div className="relative">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Flere valg"
                onClick={() => setMenu((v) => !v)}
              >
                <MoreHorizontal />
              </Button>
              {menu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Lukk meny"
                    onClick={() => setMenu(false)}
                  />
                  <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-[var(--shadow-soft)]">
                    <MenuLink
                      to="/templates/$id/edit"
                      params={{ id: template.id }}
                      onClick={() => setMenu(false)}
                    >
                      <Pencil className="size-3.5" /> Rediger
                    </MenuLink>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        duplicateTemplate(template.id);
                        setMenu(false);
                      }}
                    >
                      <Copy className="size-3.5" /> Dupliser
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive hover:bg-muted"
                      onClick={() => {
                        deleteTemplate(template.id);
                        setMenu(false);
                      }}
                    >
                      <Trash2 className="size-3.5" /> Slett
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuLink({
  to,
  params,
  children,
  onClick,
}: {
  to: "/templates/$id/edit";
  params: { id: string };
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      params={params}
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted")}
    >
      {children}
    </Link>
  );
}
