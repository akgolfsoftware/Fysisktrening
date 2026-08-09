import { Link, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TemplateForm } from "@/components/workout/TemplateForm";

export const Route = createFileRoute("/templates/new")({ component: NewTemplatePage });

function NewTemplatePage() {
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
          <h1 className="font-display text-[19px]">Ny økt</h1>
          <span />
        </header>
        <TemplateForm />
      </div>
    </AppShell>
  );
}
