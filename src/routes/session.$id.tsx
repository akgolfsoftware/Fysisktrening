import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SessionRunner } from "@/components/workout/SessionRunner";

export const Route = createFileRoute("/session/$id")({ component: SessionPage });

function SessionPage() {
  const { id } = Route.useParams();
  return (
    <AppShell active="home" hideNav>
      <SessionRunner sessionId={id} />
    </AppShell>
  );
}
