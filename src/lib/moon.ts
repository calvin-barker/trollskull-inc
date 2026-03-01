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

/** Day positions within the 30-day cycle where each phase appears (one day each) */
const PHASE_DAY_POSITIONS = [0, 4, 8, 11, 15, 19, 23, 26] as const;

export type MoonPhase = (typeof MOON_PHASES)[number];

export interface MoonPhaseResult {
  phase: MoonPhase | null;
  emoji: string | null;
  dayInCycle: number;
}

/** Compute Selûne's moon phase for a given FR date relative to a known full moon date */
export function getMoonPhase(dateDR: string, fullMoonRefDate: string): MoonPhaseResult {
  const targetAbs = dateToAbsDay(dateDR);
  const refAbs = dateToAbsDay(fullMoonRefDate);
  const dayInCycle = ((targetAbs - refAbs) % MOON_CYCLE_DAYS + MOON_CYCLE_DAYS) % MOON_CYCLE_DAYS;
  const phaseIndex = PHASE_DAY_POSITIONS.indexOf(dayInCycle as typeof PHASE_DAY_POSITIONS[number]);
  if (phaseIndex === -1) {
    return { phase: null, emoji: null, dayInCycle };
  }
  return {
    phase: MOON_PHASES[phaseIndex],
    emoji: MOON_PHASE_EMOJI[phaseIndex],
    dayInCycle,
  };
}
