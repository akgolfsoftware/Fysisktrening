import { Link, createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 pt-[var(--grok-banner-h,0px)]">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 py-8">
          <div className="space-y-1 text-center">
            <h1 className="font-display text-2xl font-medium">Logg inn</h1>
            <p className="text-sm text-muted-foreground">
              Valgfritt for Intervall. Trening fungerer uten konto.
            </p>
          </div>
          {authEnabled ? (
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Fortsett med {p.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Innlogging er slått av.</p>
          )}
          <Button asChild variant="ghost" className="w-full">
            <Link to="/">Tilbake til økter</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
