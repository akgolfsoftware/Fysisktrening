import { useNavigate } from "@tanstack/react-router";
import { Minus, Pause, Play, Plus, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const weightStep = settings.weightStepKg;

  const session = useMemo(
    () => sessions.find((x) => x.id === sessionId),
    [sessions, sessionId],
  );

  const [paused, setPaused] = useState(false);
  const [actualReps, setActualReps] = useState(0);
  const [actualWeight, setActualWeight] = useState(0);
  const tickRef = useRef<number | null>(null);

  const phase = session?.phases[session.phaseIndex];
  const progress = useMemo(() => {
    if (!session || !phase) return 0;
    if (phase.manual) return phase.setTotal > 0 ? phase.setIndex / phase.setTotal : 0.08;
    if (phase.durationSec <= 0) return 1;
    return 1 - session.remainingSec / phase.durationSec;
  }, [session, phase]);

  useEffect(() => {
    if (!phase) return;
    setActualReps(phase.targetReps ?? 0);
    setActualWeight(phase.targetWeightKg ?? 0);
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
          weightKg: actualWeight || p.targetWeightKg,
          reps: actualReps || p.targetReps,
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
        <p className="font-display text-xl">Fant ikke økten.</p>
        <Button onClick={() => navigate({ to: "/" })}>Tilbake</Button>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="label-caps text-strength">Fullført</p>
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
  const sportTone =
    session.sport === "strength"
      ? "text-strength"
      : session.sport === "mobility"
        ? "text-mobility"
        : "text-running";

  const r = 112;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="flex min-h-[75dvh] flex-col">
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <p className={cn("label-caps", sportTone)}>
            {SPORT_LABEL[session.sport]} · {ENV_LABEL[session.environment]}
          </p>
          <h1 className="mt-1 font-display text-[22px] leading-tight">{session.templateName}</h1>
        </div>
        <button
          type="button"
          className="min-h-11 text-[13.5px] text-destructive"
          onClick={() => {
            abortSession(session.id);
            void navigate({ to: "/" });
          }}
        >
          Avbryt
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
        <div className="relative size-[250px]">
          <svg viewBox="0 0 250 250" className="size-full -rotate-90">
            <circle
              cx="125"
              cy="125"
              r={r}
              fill="none"
              className="stroke-muted"
              strokeWidth="12"
            />
            <circle
              cx="125"
              cy="125"
              r={r}
              fill="none"
              className={cn(ringColor, "transition-[stroke-dashoffset] duration-300")}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <p
              className={cn(
                "label-caps",
                isRest ? "text-rest" : "text-muted-foreground",
              )}
            >
              {isRest ? "Pause" : phase.label === "Pause" ? "Pause" : "Arbeid"}
            </p>
            {phase.manual ? (
              <p className="font-display text-[58px] leading-none tabular tracking-tight">
                {phase.targetReps ?? "—"}{" "}
                <span className="text-[30px] text-muted-foreground">reps</span>
              </p>
            ) : (
              <p className="font-display text-[64px] leading-none tabular tracking-tight">
                {formatMmSs(session.remainingSec)}
              </p>
            )}
            <p className="text-[13.5px] tabular text-muted-foreground">
              {phase.setTotal > 1
                ? `${session.sport === "strength" ? "Sett" : "Drag"} ${phase.setIndex} av ${phase.setTotal}`
                : `Fase ${session.phaseIndex + 1} av ${session.phases.length}`}
            </p>
          </div>
        </div>

        <div className="text-center">
          {phase.exerciseName && (
            <p className="text-lg font-semibold">{phase.exerciseName}</p>
          )}
          <p className="mt-1 text-[13px] tabular text-muted-foreground">
            {[
              phase.targetWeightKg != null && phase.targetWeightKg > 0
                ? `Mål ${phase.targetWeightKg} kg`
                : null,
              phase.targetRpe != null ? `RPE ${phase.targetRpe}` : null,
              phase.targetSpeedKmh != null
                ? formatSpeed(phase.targetSpeedKmh, settings.speedUnit)
                : null,
              phase.targetZone != null
                ? `Sone ${phase.targetZone} · ${ZONE_META[phase.targetZone].name}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {phase.notes && (
            <p className="mt-1 text-xs text-muted-foreground">{phase.notes}</p>
          )}
        </div>

        {!phase.manual && phase.targetZone && (
          <div className="flex gap-2">
            <span className="rounded-full border border-running/35 px-3 py-1.5 text-[12.5px] text-running">
              Neste: sone {phase.targetZone}
            </span>
            {phase.targetSpeedKmh != null && (
              <span className="rounded-full border border-border px-3 py-1.5 text-[12.5px] tabular text-muted-foreground">
                {formatSpeed(phase.targetSpeedKmh, settings.speedUnit)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 pb-2">
        {phase.manual && (
          <div className="flex gap-2.5">
            <StepperField
              label="Vekt (kg)"
              value={actualWeight}
              step={weightStep}
              onChange={setActualWeight}
            />
            <StepperField
              label="Reps"
              value={actualReps}
              step={1}
              onChange={setActualReps}
            />
          </div>
        )}

        {phase.manual ? (
          <>
            <Button
              size="lg"
              className="w-full rounded-[14px]"
              onClick={() => {
                if (settings.soundEnabled) playBeep("phase");
                advance(session, true);
              }}
            >
              Sett fullført
            </Button>
            <div className="flex gap-2.5">
              <Button variant="outline" className="min-h-12 flex-1 rounded-[14px]" disabled>
                Pause {formatMmSs(
                  session.phases[session.phaseIndex + 1]?.kind === "rest"
                    ? session.phases[session.phaseIndex + 1]!.durationSec
                    : 0,
                )}
              </Button>
              <Button
                variant="outline"
                className="min-h-12 flex-1 rounded-[14px]"
                onClick={() => {
                  if (settings.soundEnabled) playBeep("phase");
                  advance(session, true);
                }}
              >
                Hopp over
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-2.5">
            <Button
              size="lg"
              className="min-h-14 flex-[2] rounded-[14px]"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play className="fill-current" /> : <Pause />}
              {paused ? "Fortsett" : "Pause økt"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-14 flex-1 rounded-[14px]"
              onClick={() => {
                if (settings.soundEnabled) playBeep("phase");
                advance(session);
              }}
            >
              <SkipForward className="size-4" /> Neste
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepperField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-border bg-card p-2.5 px-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex size-[34px] items-center justify-center rounded-[9px] bg-muted text-primary"
          onClick={() => onChange(Math.max(0, Math.round((value - step) * 10) / 10))}
          aria-label={`Mindre ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="font-display text-2xl tabular leading-none">
          {Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")}
        </span>
        <button
          type="button"
          className="flex size-[34px] items-center justify-center rounded-[9px] bg-muted text-primary"
          onClick={() => onChange(Math.round((value + step) * 10) / 10)}
          aria-label={`Mer ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
