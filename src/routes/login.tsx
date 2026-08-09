import { Link, createFileRoute } from "@tanstack/react-router";
import { IronMileMark } from "@/components/brand/IronMileMark";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <main className="iron-hero relative flex min-h-dvh flex-col px-6 pt-[var(--grok-banner-h,0px)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <IronMileMark size="xl" />
        <h1 className="font-display text-[32px] leading-none">{BRAND.name}</h1>
        <p className="max-w-[30ch] text-sm leading-relaxed text-muted-foreground text-pretty">
          Valgfri innlogging. Appen virker fullt ut uten konto — logg inn hvis du vil ha øktene
          på flere enheter.
        </p>
      </div>
      <div className="space-y-2.5 pb-10">
        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              Fortsett med {p.label}
            </Button>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground">Innlogging er slått av.</p>
        )}
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link to="/">Tilbake til økter</Link>
        </Button>
      </div>
    </main>
  );
}
