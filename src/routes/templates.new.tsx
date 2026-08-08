import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/workout/TemplateForm";

export const Route = createFileRoute("/templates/new")({ component: NewTemplatePage });

function NewTemplatePage() {
  return (
    <AppShell active="home">
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" aria-label="Tilbake">
            <Link to="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-medium">Ny økt</h1>
        </header>
        <TemplateForm />
      </div>
    </AppShell>
  );
}
