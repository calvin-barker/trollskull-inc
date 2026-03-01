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

  it('returns Full Moon on the reference date', () => {
    const result = getMoonPhase(ref, ref);
    expect(result.phase).toBe('Full Moon');
    expect(result.dayInCycle).toBe(0);
    expect(result.emoji).toBe('🌕');
  });

  it('returns New Moon ~15 days after reference', () => {
    const result = getMoonPhase('1492-01-16', ref);
    expect(result.phase).toBe('New Moon');
  });

  it('returns Waning Gibbous a few days after full', () => {
    const result = getMoonPhase('1492-01-05', ref);
    expect(result.phase).toBe('Waning Gibbous');
  });

  it('wraps around at 30 days (next full moon)', () => {
    // 30 days from Hammer 1 = Midwinter(1) + 29 more into Alturiak
    // Actually: Hammer has 30 days (01-01 to 01-30), then Midwinter (02-01), then Alturiak starts at 03-01
    // Day 30 from 01-01 = 02-01 (Midwinter) which is absDay 30
    // Day 31 = 03-01 (Alturiak day 1)
    // So 30 days after 01-01 is 02-01
    const result = getMoonPhase('1492-02-01', ref); // 30 days later
    expect(result.phase).toBe('Full Moon');
    expect(result.dayInCycle).toBe(0);
  });

  it('works across years', () => {
    // 365 days = 12 full cycles (360) + 5 remaining
    const result = getMoonPhase('1493-01-01', ref);
    expect(result.dayInCycle).toBe(5);
    expect(result.phase).toBe('Waning Gibbous');
  });

  it('works for dates before the reference', () => {
    // 15 days before full moon should be ~new moon
    // We need a date before 1492-01-01... use 1491
    // Actually dateToAbsDay uses 1492 as base, so 1491 dates give negative abs days
    // Let's use a later reference instead
    const laterRef = '1492-01-16';
    const result = getMoonPhase('1492-01-01', laterRef);
    // 15 days before ref → dayInCycle = ((-15 % 30) + 30) % 30 = 15
    expect(result.dayInCycle).toBe(15);
    expect(result.phase).toBe('New Moon');
  });

  it('each phase covers ~3-4 days of the cycle', () => {
    const phases = new Set<string>();
    for (let d = 0; d < 30; d++) {
      const date = `1492-01-${String(d + 1).padStart(2, '0')}`;
      phases.add(getMoonPhase(date, ref).phase);
    }
    expect(phases.size).toBe(8);
  });
});
