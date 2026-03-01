import { dateToAbsDay } from './calendar';

export const MOON_CYCLE_DAYS = 30;

export const MOON_PHASES = [
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
] as const;

export const MOON_PHASE_EMOJI = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'] as const;

export type MoonPhase = (typeof MOON_PHASES)[number];

export interface MoonPhaseResult {
  phase: MoonPhase;
  emoji: string;
  dayInCycle: number;
}

/** Compute Selûne's moon phase for a given FR date relative to a known full moon date */
export function getMoonPhase(dateDR: string, fullMoonRefDate: string): MoonPhaseResult {
  const targetAbs = dateToAbsDay(dateDR);
  const refAbs = dateToAbsDay(fullMoonRefDate);
  const dayInCycle = ((targetAbs - refAbs) % MOON_CYCLE_DAYS + MOON_CYCLE_DAYS) % MOON_CYCLE_DAYS;
  const phaseIndex = Math.floor(dayInCycle * 8 / MOON_CYCLE_DAYS);
  return {
    phase: MOON_PHASES[phaseIndex],
    emoji: MOON_PHASE_EMOJI[phaseIndex],
    dayInCycle,
  };
}
