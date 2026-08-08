/** Olympiatoppen intensity scale (2024) — lower bound % of max HR */
export const OLYMPIATOPPEN_ZONE_LOW: [number, number, number, number, number] = [
  55, 72, 82, 87, 92,
];

export const ZONE_META: Record<
  1 | 2 | 3 | 4 | 5,
  { name: string; borg: string; breathing: string }
> = {
  1: {
    name: "Veldig lett",
    borg: "under 11",
    breathing: "Kan snakke uanstrengt",
  },
  2: {
    name: "Nokså lett",
    borg: "under 13",
    breathing: "Kan si lengre setninger relativt uanstrengt",
  },
  3: {
    name: "Behagelig anstrengende",
    borg: "13–14",
    breathing: "Kan si korte setninger",
  },
  4: {
    name: "Anstrengende",
    borg: "14–16",
    breathing: "Kan si noen ord eller svært korte setninger",
  },
  5: {
    name: "Veldig anstrengende",
    borg: "16–19",
    breathing: "Kan kun si et ord eller to, puster tungt",
  },
};

export function zoneRange(
  zone: 1 | 2 | 3 | 4 | 5,
  maxHr: number,
  lows: [number, number, number, number, number] = OLYMPIATOPPEN_ZONE_LOW,
): { low: number; high: number; lowPct: number; highPct: number } {
  const lowPct = lows[zone - 1];
  const highPct = zone === 5 ? 100 : lows[zone];
  return {
    low: Math.round((maxHr * lowPct) / 100),
    high: Math.round((maxHr * highPct) / 100),
    lowPct,
    highPct,
  };
}
