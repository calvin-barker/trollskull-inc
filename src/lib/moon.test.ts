import { describe, it, expect } from 'vitest';
import { getMoonPhase, MOON_CYCLE_DAYS, MOON_PHASES, MOON_PHASE_EMOJI } from './moon';

describe('moon constants', () => {
  it('cycle is 30 days', () => {
    expect(MOON_CYCLE_DAYS).toBe(30);
  });

  it('has 8 phases', () => {
    expect(MOON_PHASES).toHaveLength(8);
    expect(MOON_PHASE_EMOJI).toHaveLength(8);
  });

  it('starts with Full Moon', () => {
    expect(MOON_PHASES[0]).toBe('Full Moon');
  });
});

describe('getMoonPhase', () => {
  const ref = '1492-01-01'; // reference full moon

  it('returns Full Moon on the reference date (day 0)', () => {
    const result = getMoonPhase(ref, ref);
    expect(result.phase).toBe('Full Moon');
    expect(result.dayInCycle).toBe(0);
    expect(result.emoji).toBe('🌕');
  });

  it('returns New Moon on day 15', () => {
    const result = getMoonPhase('1492-01-16', ref);
    expect(result.phase).toBe('New Moon');
    expect(result.emoji).toBe('🌑');
    expect(result.dayInCycle).toBe(15);
  });

  it('returns Waning Gibbous on day 4', () => {
    const result = getMoonPhase('1492-01-05', ref);
    expect(result.phase).toBe('Waning Gibbous');
    expect(result.emoji).toBe('🌖');
  });

  it('returns null phase/emoji on non-phase days', () => {
    // Day 1 is not a phase day
    const result = getMoonPhase('1492-01-02', ref);
    expect(result.phase).toBeNull();
    expect(result.emoji).toBeNull();
    expect(result.dayInCycle).toBe(1);
  });

  it('wraps around at 30 days (next full moon)', () => {
    const result = getMoonPhase('1492-02-01', ref); // 30 days later
    expect(result.phase).toBe('Full Moon');
    expect(result.dayInCycle).toBe(0);
  });

  it('works across years', () => {
    // 365 days = 12 full cycles (360) + 5 remaining
    const result = getMoonPhase('1493-01-01', ref);
    expect(result.dayInCycle).toBe(5);
    // Day 5 is not a phase position, so null
    expect(result.phase).toBeNull();
  });

  it('works for dates before the reference', () => {
    const laterRef = '1492-01-16';
    const result = getMoonPhase('1492-01-01', laterRef);
    // 15 days before ref → dayInCycle = 15
    expect(result.dayInCycle).toBe(15);
    expect(result.phase).toBe('New Moon');
  });

  it('shows exactly 8 phase days per cycle', () => {
    let phaseCount = 0;
    for (let d = 0; d < 30; d++) {
      const date = `1492-01-${String(d + 1).padStart(2, '0')}`;
      const result = getMoonPhase(date, ref);
      if (result.phase !== null) phaseCount++;
    }
    expect(phaseCount).toBe(8);
  });

  it('each phase appears exactly once per cycle', () => {
    const phases: string[] = [];
    for (let d = 0; d < 30; d++) {
      const date = `1492-01-${String(d + 1).padStart(2, '0')}`;
      const result = getMoonPhase(date, ref);
      if (result.phase !== null) phases.push(result.phase);
    }
    expect(new Set(phases).size).toBe(8);
  });
});
