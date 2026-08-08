import { useNavigate } from "@tanstack/react-router";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ENV_LABEL, SPORT_LABEL, formatMmSs, formatSpeed } from "@/lib/intervall/format";
import { playBeep } from "@/lib/intervall/sound";
import { useIntervallStore } from "@/lib/intervall/store";
import type { Session } from "@/lib/intervall/types";
import { ZONE_META } from "@/lib/intervall/zones";
import { cn } from "@/lib/utils";

export function SessionRunner({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const sessions = useIntervallStore((s) => s.sessions);
  const settings = useIntervallStore((s) => s.settings);
  const updateSession = useIntervallStore((s) => s.updateSession);
  const completeSession = useIntervallStore((s) => s.completeSession);
  const abortSession = useIntervallStore((s) => s.abortSession);
  const logSet = useIntervallStore((s) => s.logSet);

  const session = useMemo(
    () => sessions.find((x) => x.id === sessionId),
    [sessions, sessionId],
  );

  const [paused, setPaused] = useState(false);
  const [actualReps, setActualReps] = useState<string>("");
  const [actualWeight, setActualWeight] = useState<string>("");
  const tickRef = useRef<number | null>(null);

  const phase = session?.phases[session.phaseIndex];
  const progress = useMemo(() => {
    if (!session || !phase) return 0;
    if (phase.manual) return 0;
    if (phase.durationSec <= 0) return 1;
    return 1 - session.remainingSec / phase.durationSec;
  }, [session, phase]);

  // Sync editable fields when phase changes
  useEffect(() => {
    if (!phase) return;
    setActualReps(phase.targetReps != null ? String(phase.targetReps) : "");
    setActualWeight(phase.targetWeightKg != null ? String(phase.targetWeightKg) : "");
  }, [phase?.id]);

  useEffect(() => {
    if (!session || session.status !== "active" || !phase || phase.manual || paused) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      const s = useIntervallStore.getState().sessions.find((x) => x.id === sessionId);
      if (!s || s.status !== "active") return;
      const p = s.phases[s.phaseIndex];
      if (!p || p.manual) return;

      if (s.remainingSec <= 1) {
        if (settings.soundEnabled) playBeep("phase");
        advance(s);
      } else {
        const next = s.remainingSec - 1;
        updateSession(s.id, { remainingSec: next });
        if (settings.soundEnabled && next <= 3 && next > 0) playBeep("tick");
      }
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, session?.phaseIndex, session?.status, phase?.manual, paused, settings.soundEnabled]);

  function advance(s: Session, withLog = false) {
    if (withLog) {
      const p = s.phases[s.phaseIndex];
      if (p) {
        logSet(s.id, p.id, {
          weightKg: actualWeight ? Number(actualWeight) : p.targetWeightKg,
          reps: actualReps ? Number(actualReps) : p.targetReps,
        });
      }
    }

    const nextIndex = s.phaseIndex + 1;
    if (nextIndex >= s.phases.length) {
      if (settings.soundEnabled) playBeep("done");
      completeSession(s.id);
      void navigate({ to: "/history/$id", params: { id: s.id } });
      return;
    }
    const next = s.phases[nextIndex]!;
    const completedSets =
      s.phases[s.phaseIndex]?.kind === "work" && s.sport === "strength"
        ? s.completedSets + 1
        : s.completedSets;
    updateSession(s.id, {
      phaseIndex: nextIndex,
      remainingSec: next.manual ? 0 : next.durationSec,
      completedSets,
    });
  }

  if (!session || !phase) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Fant ikke økten.</p>
        <Button onClick={() => navigate({ to: "/" })}>Tilbake</Button>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="font-display text-3xl">Økt fullført</h1>
        <p className="text-muted-foreground">{session.templateName}</p>
        <Button onClick={() => navigate({ to: "/history/$id", params: { id: session.id } })}>
          Se oppsummering
        </Button>
      </div>
    );
  }

  const isRest = phase.kind === "rest";
  const ringColor = isRest
    ? "stroke-rest"
    : session.sport === "strength"
      ? "stroke-strength"
      : "stroke-work";

  return (
    <div className="flex min-h-[70dvh] flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SPORT_LABEL[session.sport]} · {ENV_LABEL[session.environment]}
          </p>
          <h1 className="font-display text-2xl font-medium">{session.templateName}</h1>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Avbryt økt"
          onClick={() => {
            abortSession(session.id);
            void navigate({ to: "/" });
          }}
        >
          <X />
        </Button>
      </header>

      <div className="relative mx-auto grid size-64 place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            className={cn(ringColor, "transition-[stroke-dashoffset] duration-300")}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - (phase.manual ? 0.08 : progress))}
          />
        </svg>
        <div className="z-10 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {phase.label}
            {phase.setTotal > 1 ? ` · ${phase.setIndex}/${phase.setTotal}` : ""}
          </p>
          {phase.manual ? (
            <p className="font-display text-4xl font-medium tabular">
              {phase.targetReps ?? "—"}
              <span className="ml-1 text-lg text-muted-foreground">reps</span>
            </p>
          ) : (
            <p className="font-display text-5xl font-medium tabular tracking-tight">
              {formatMmSs(session.remainingSec)}
            </p>
          )}
        </div>
      </div>

      <Card
        className={cn(
          "border-0",
          isRest ? "bg-rest/10" : session.sport === "strength" ? "bg-strength/10" : "bg-work/10",
        )}
      >
        <CardContent className="space-y-1 py-4 text-center">
          {phase.exerciseName && (
            <p className="font-display text-xl">{phase.exerciseName}</p>
          )}
          {phase.targetWeightKg != null && phase.targetWeightKg > 0 && (
            <p className="text-sm text-muted-foreground">{phase.targetWeightKg} kg</p>
          )}
          {phase.targetRpe != null && (
            <p className="text-sm text-muted-foreground">Mål-RPE {phase.targetRpe}</p>
          )}
          {phase.notes && (
            <p className="text-xs text-muted-foreground">{phase.notes}</p>
          )}
          {phase.targetSpeedKmh != null && (
            <p className="text-sm text-muted-foreground">
              Mål: {formatSpeed(phase.targetSpeedKmh, settings.speedUnit)}
            </p>
          )}
          {phase.targetZone && (
            <p className="text-sm text-muted-foreground">
              Sone {phase.targetZone} · {ZONE_META[phase.targetZone].name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Fase {session.phaseIndex + 1} av {session.phases.length}
          </p>
        </CardContent>
      </Card>

      {phase.manual && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="actual-reps" className="text-xs">
              Faktiske reps
            </Label>
            <Input
              id="actual-reps"
              type="number"
              min={0}
              className="text-center"
              value={actualReps}
              onChange={(e) => setActualReps(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actual-kg" className="text-xs">
              Faktisk vekt (kg)
            </Label>
            <Input
              id="actual-kg"
              type="number"
              min={0}
              step={0.5}
              className="text-center"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {phase.manual ? (
          <Button
            size="lg"
            className="h-14 w-full text-base"
            onClick={() => {
              if (settings.soundEnabled) playBeep("phase");
              advance(session, true);
            }}
          >
            Fullfør sett
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="h-14"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play className="fill-current" /> : <Pause />}
              {paused ? "Fortsett" : "Pause"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14"
              onClick={() => {
                if (settings.soundEnabled) playBeep("phase");
                advance(session);
              }}
            >
              <SkipForward /> Hopp over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
