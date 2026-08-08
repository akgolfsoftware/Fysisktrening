import { Link, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useIntervallStore } from "@/lib/intervall/store";
import { OLYMPIATOPPEN_ZONE_LOW, ZONE_META, zoneRange } from "@/lib/intervall/zones";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

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
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-medium">Innstillinger</h1>
          <p className="text-sm text-muted-foreground">Puls, enheter, styrke og lyd</p>
        </header>

        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxhr">Makspuls</Label>
              <Input
                id="maxhr"
                type="number"
                inputMode="numeric"
                min={100}
                max={230}
                value={settings.maxHr}
                onChange={(e) =>
                  updateSettings({
                    maxHr: Math.min(230, Math.max(100, Number(e.target.value) || 190)),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Brukes til å beregne pulssonene under.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fartsenhet</Label>
              <Segmented
                value={settings.speedUnit}
                onChange={(speedUnit) => updateSettings({ speedUnit })}
                options={[
                  { value: "kmh", label: "km/t" },
                  { value: "pace", label: "min/km" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sound">Lydvarsler under økt</Label>
              <Switch
                id="sound"
                checked={settings.soundEnabled}
                onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 py-4">
            <div>
              <h2 className="font-display text-lg">Styrkeprogrammer</h2>
              <p className="text-xs text-muted-foreground">
                Progresjon og standarder for tilpasning
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wstep">Vektsteg (kg)</Label>
              <Segmented
                value={String(settings.weightStepKg) as "1.25" | "2.5" | "5"}
                onChange={(v) => updateSettings({ weightStepKg: Number(v) })}
                options={[
                  { value: "1.25", label: "1,25" },
                  { value: "2.5", label: "2,5" },
                  { value: "5", label: "5" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Brukes ved +/− på øvelser og automatisk progresjon etter fullførte sett.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="srest">Standard pause mellom sett (sek)</Label>
              <Input
                id="srest"
                type="number"
                min={0}
                step={15}
                value={settings.defaultStrengthRestSec}
                onChange={(e) =>
                  updateSettings({
                    defaultStrengthRestSec: Math.max(0, Number(e.target.value) || 90),
                  })
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {logCount > 0
                ? `${logCount} øvelser med lagret progresjonshistorikk`
                : "Ingen styrkehistorikk ennå — fullfør en økt for å låse opp progresjonsforslag"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg">Dine pulssoner</h2>
                <p className="text-xs text-muted-foreground">
                  Olympiatoppens intensitetsskala (2024)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Label htmlFor="custom-zones" className="text-xs">
                  Egne soner
                </Label>
                <Switch
                  id="custom-zones"
                  checked={settings.customZones}
                  onCheckedChange={(customZones) => updateSettings({ customZones })}
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {([1, 2, 3, 4, 5] as const).map((z) => {
                const range = zoneRange(z, settings.maxHr, lows);
                return (
                  <div key={z} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">
                        Sone {z} · {ZONE_META[z].name}
                      </span>
                      <span className="shrink-0 font-mono text-sm tabular">
                        {range.low}–{range.high}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {range.lowPct}–{range.highPct} % av makspuls · Borg {ZONE_META[z].borg}
                    </p>
                    <p className="text-xs text-muted-foreground">{ZONE_META[z].breathing}</p>
                    {settings.customZones && z < 5 && (
                      <div className="pt-1">
                        <Label className="text-xs" htmlFor={`zone-low-${z}`}>
                          Sone {z} nedre grense (%)
                        </Label>
                        <Input
                          id={`zone-low-${z}`}
                          type="number"
                          min={40}
                          max={99}
                          className="mt-1 h-9"
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
                className="mt-4"
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-4">
            <h2 className="font-display text-lg">Data</h2>
            <p className="text-sm text-muted-foreground">
              Alt lagres lokalt i nettleseren på denne enheten. Ingen konto kreves for å trene.
            </p>
            <Button type="button" variant="outline" onClick={() => resetSeeds()}>
              Gjenopprett startpakke-maler
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <h2 className="font-display text-lg">Konto</h2>
              <p className="text-sm text-muted-foreground">Valgfritt — synk kommer senere</p>
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

type SettingsZones = [number, number, number, number, number];
