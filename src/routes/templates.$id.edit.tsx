import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/workout/TemplateForm";
import { useIntervallStore } from "@/lib/intervall/store";

export const Route = createFileRoute("/templates/$id/edit")({ component: EditTemplatePage });

function EditTemplatePage() {
  const { id } = Route.useParams();
  const templates = useIntervallStore((s) => s.templates);
  const template = useMemo(() => templates.find((t) => t.id === id), [templates, id]);

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

  return (
    <AppShell active="home" hideNav>
      <div className="space-y-4">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
          >
            ← Tilbake
          </Link>
          <h1 className="font-display text-[19px]">Rediger mal</h1>
          <span />
        </header>
        <TemplateForm initial={template} />
      </div>
    </AppShell>
  );
}
