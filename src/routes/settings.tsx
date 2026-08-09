import { Link, createFileRoute } from "@tanstack/react-router";
import { IronMileMark } from "@/components/brand/IronMileMark";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BRAND } from "@/lib/brand";
import { useIntervallStore } from "@/lib/intervall/store";
import { OLYMPIATOPPEN_ZONE_LOW, ZONE_META, zoneRange } from "@/lib/intervall/zones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const zoneBarColor: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-mobility",
  2: "bg-running",
  3: "bg-rest",
  4: "bg-strength",
  5: "bg-destructive",
};

function SettingsPage() {
  const settings = useIntervallStore((s) => s.settings);
  const updateSettings = useIntervallStore((s) => s.updateSettings);
  const resetSeeds = useIntervallStore((s) => s.resetSeeds);
  const exerciseLogs = useIntervallStore((s) => s.exerciseLogs);
  const { user, isPending } = useCurrentUserState();

  const lows = settings.customZones ? settings.zoneLowPct : OLYMPIATOPPEN_ZONE_LOW;
  const logCount = Object.keys(exerciseLogs).length;

  return (
    <AppShell active="settings">
      <div className="space-y-3.5">
        <h1 className="font-display text-[28px] leading-tight">Innstillinger</h1>

        <div className="flex items-center gap-3 rounded-[18px] bg-primary p-4">
          <IronMileMark size="md" />
          <div className="min-w-0">
            <p className="font-display text-xl text-primary-foreground">{BRAND.name}</p>
            <p className="text-[11.5px] text-primary-foreground/65">
              {BRAND.tagline} · v1.0
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-border bg-card px-4">
          <Row label="Makspuls">
            <Input
              type="number"
              inputMode="numeric"
              min={100}
              max={230}
              className="h-9 w-20 border-0 bg-transparent px-0 text-right text-[13.5px] tabular text-muted-foreground shadow-none focus-visible:outline-none"
              value={settings.maxHr}
              onChange={(e) =>
                updateSettings({
                  maxHr: Math.min(230, Math.max(100, Number(e.target.value) || 190)),
                })
              }
            />
          </Row>
          <Row label="Fartsenhet">
            <Segmented
              className="w-[9.5rem]"
              value={settings.speedUnit}
              onChange={(speedUnit) => updateSettings({ speedUnit })}
              options={[
                { value: "kmh", label: "km/t" },
                { value: "pace", label: "pace" },
              ]}
            />
          </Row>
          <Row label="Lyd under økt">
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
            />
          </Row>
          <Row label="Vektsteg">
            <Segmented
              className="w-[11rem]"
              value={String(settings.weightStepKg) as "1.25" | "2.5" | "5"}
              onChange={(v) => updateSettings({ weightStepKg: Number(v) })}
              options={[
                { value: "1.25", label: "1,25" },
                { value: "2.5", label: "2,5" },
                { value: "5", label: "5" },
              ]}
            />
          </Row>
          <Row label="Pause mellom sett" last>
            <Input
              type="number"
              min={0}
              step={15}
              className="h-9 w-16 border-0 bg-transparent px-0 text-right text-[13.5px] tabular text-muted-foreground shadow-none focus-visible:outline-none"
              value={settings.defaultStrengthRestSec}
              onChange={(e) =>
                updateSettings({
                  defaultStrengthRestSec: Math.max(0, Number(e.target.value) || 90),
                })
              }
            />
          </Row>
        </div>

        <p className="px-1 text-sm text-muted-foreground">
          {logCount > 0
            ? `${logCount} øvelser med lagret progresjonshistorikk`
            : "Ingen styrkehistorikk ennå"}
        </p>

        <div className="space-y-2.5 rounded-[18px] border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">Pulssoner — Olympiatoppen</h2>
              <p className="text-xs text-muted-foreground">Intensitetsskala 2024</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-zones" className="text-xs text-muted-foreground">
                Egne
              </Label>
              <Switch
                id="custom-zones"
                checked={settings.customZones}
                onCheckedChange={(customZones) => updateSettings({ customZones })}
              />
            </div>
          </div>
          <div className="space-y-2.5 pt-1">
            {([1, 2, 3, 4, 5] as const).map((z) => {
              const range = zoneRange(z, settings.maxHr, lows);
              const width = `${Math.min(100, Math.max(12, range.highPct - 40))}%`;
              return (
                <div key={z} className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 font-mono text-[11.5px] text-muted-foreground">
                      S{z}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                      <div className={cn("h-2 rounded", zoneBarColor[z])} style={{ width }} />
                    </div>
                    <span className="shrink-0 font-mono text-[11.5px] tabular text-muted-foreground">
                      {range.low}–{range.high}
                    </span>
                  </div>
                  <p className="pl-8 text-[11px] text-muted-foreground">
                    {ZONE_META[z].name} · {range.lowPct}–{range.highPct} %
                  </p>
                  {settings.customZones && z < 5 && (
                    <div className="pl-8 pt-0.5">
                      <Input
                        type="number"
                        min={40}
                        max={99}
                        className="h-9"
                        value={settings.zoneLowPct[z - 1]}
                        onChange={(e) => {
                          const next = [...settings.zoneLowPct] as SettingsZones;
                          next[z - 1] = Number(e.target.value) || next[z - 1];
                          updateSettings({ zoneLowPct: next });
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {settings.customZones && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateSettings({
                  zoneLowPct: [...OLYMPIATOPPEN_ZONE_LOW],
                  customZones: false,
                })
              }
            >
              Tilbakestill til Olympiatoppen
            </Button>
          )}
        </div>

        <div className="space-y-3 rounded-[18px] border border-border bg-card p-4">
          <h2 className="text-[15px] font-semibold">Data</h2>
          <p className="text-sm text-muted-foreground">
            Alt lagres lokalt i nettleseren på denne enheten.
          </p>
          <Button type="button" variant="outline" onClick={() => resetSeeds()}>
            Gjenopprett startpakke-maler
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card p-4">
          <div>
            <h2 className="text-[15px] font-semibold">Konto</h2>
            <p className="text-sm text-muted-foreground">Valgfritt</p>
          </div>
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : (
            <>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Button asChild size="sm" variant="outline">
                  <Link to="/login">Logg inn</Link>
                </Button>
              </SignedOut>
            </>
          )}
          {user && <p className="sr-only">Innlogget som {user.displayName}</p>}
        </div>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[52px] items-center justify-between gap-3",
        !last && "border-b border-border",
      )}
    >
      <span className="whitespace-nowrap text-[14.5px]">{label}</span>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

type SettingsZones = [number, number, number, number, number];
