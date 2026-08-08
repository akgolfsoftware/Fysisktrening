import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
      <AppShell active="home">
        <p className="text-muted-foreground">Fant ikke malen.</p>
        <Button asChild className="mt-4">
          <Link to="/">Tilbake</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell active="home">
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" aria-label="Tilbake">
            <Link to="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-medium">Rediger økt</h1>
        </header>
        <TemplateForm initial={template} />
      </div>
    </AppShell>
  );
}
