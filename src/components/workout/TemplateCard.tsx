import { Link } from "@tanstack/react-router";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { SportBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ENV_LABEL,
  SPORT_LABEL,
  countDrags,
  formatDurationLong,
  totalTemplateSeconds,
} from "@/lib/intervall/format";
import type { Sport, Template } from "@/lib/intervall/types";
import { useIntervallStore } from "@/lib/intervall/store";
import { cn } from "@/lib/utils";

const sportBar: Record<Sport, string> = {
  running: "bg-running",
  strength: "bg-strength",
  mobility: "bg-mobility",
};

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
    <div className="relative flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-card px-[15px] py-3.5 shadow-[var(--shadow-soft)]">
      <div className={cn("w-1 self-stretch rounded-sm", sportBar[template.sport])} />
      <Link
        to="/templates/$id/start"
        params={{ id: template.id }}
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <h3 className="truncate text-base font-semibold tracking-tight">{template.name}</h3>
        <p className="text-[12.5px] tabular text-muted-foreground">{subtitle}</p>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <SportBadge sport={template.sport} label={SPORT_LABEL[template.sport]} />
        <span className="text-[11.5px] text-muted-foreground">
          {ENV_LABEL[template.environment]}
        </span>
      </div>
      <div className="relative">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          aria-label="Flere valg"
          onClick={() => setMenu((v) => !v)}
        >
          <MoreHorizontal className="size-5" />
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
              <Link
                to="/templates/$id/edit"
                params={{ id: template.id }}
                onClick={() => setMenu(false)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              >
                <Pencil className="size-3.5" /> Rediger
              </Link>
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
  );
}
