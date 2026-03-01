import { describe, it, expect } from 'vitest';
import { getOccupiedRoomIds, type BookingRecord } from './hospitality';

describe('getOccupiedRoomIds', () => {
  const booking = (room_id: number, check_in: string, check_out: string, paid = 0): BookingRecord => ({
    room_id, check_in, check_out, paid,
  });

  it('returns empty set when no bookings', () => {
    expect(getOccupiedRoomIds([], '1492-01-15')).toEqual(new Set());
  });

  it('returns room with active booking on current date', () => {
    const bookings = [booking(1, '1492-01-10', '1492-01-20')];
    expect(getOccupiedRoomIds(bookings, '1492-01-15')).toEqual(new Set([1]));
  });

  it('includes room on check-in day', () => {
    const bookings = [booking(1, '1492-01-10', '1492-01-20')];
    expect(getOccupiedRoomIds(bookings, '1492-01-10')).toEqual(new Set([1]));
  });

  it('excludes room on check-out day (guest has left)', () => {
    const bookings = [booking(1, '1492-01-10', '1492-01-20')];
    expect(getOccupiedRoomIds(bookings, '1492-01-20')).toEqual(new Set());
  });

  it('excludes paid (checked-out) bookings', () => {
    const bookings = [booking(1, '1492-01-10', '1492-01-20', 1)];
    expect(getOccupiedRoomIds(bookings, '1492-01-15')).toEqual(new Set());
  });

  it('handles booking spanning a festival day', () => {
    // Hammer ends day 30 (month 01), Midwinter is month 02, Alturiak is month 03
    const bookings = [booking(1, '1492-01-28', '1492-03-03')];
    // During Midwinter (month 02, day 01) — should be occupied
    expect(getOccupiedRoomIds(bookings, '1492-02-01')).toEqual(new Set([1]));
    // During Alturiak day 2 — should be occupied
    expect(getOccupiedRoomIds(bookings, '1492-03-02')).toEqual(new Set([1]));
  });

  it('handles booking spanning across multiple months', () => {
    // Check-in in Tarsakh (month 05), check-out in Mirtul (month 07) — spans Greengrass (06)
    const bookings = [booking(1, '1492-05-25', '1492-07-05')];
    // During Greengrass festival
    expect(getOccupiedRoomIds(bookings, '1492-06-01')).toEqual(new Set([1]));
    // During Mirtul day 3
    expect(getOccupiedRoomIds(bookings, '1492-07-03')).toEqual(new Set([1]));
  });

  it('handles multiple rooms with mixed occupancy', () => {
    const bookings = [
      booking(1, '1492-01-10', '1492-01-20'),      // active, in range
      booking(2, '1492-01-10', '1492-01-20', 1),    // paid
      booking(3, '1492-01-01', '1492-01-10'),        // ended before current date
      booking(4, '1492-01-20', '1492-01-30'),        // starts after current date
    ];
    expect(getOccupiedRoomIds(bookings, '1492-01-15')).toEqual(new Set([1]));
  });

  it('handles booking spanning year boundary', () => {
    const bookings = [booking(1, '1492-17-25', '1493-01-05')];
    expect(getOccupiedRoomIds(bookings, '1492-17-28')).toEqual(new Set([1]));
    expect(getOccupiedRoomIds(bookings, '1493-01-02')).toEqual(new Set([1]));
  });

  it('does not show rooms as occupied before check-in', () => {
    const bookings = [
      booking(1, '1492-01-08', '1492-01-12'),
      booking(2, '1492-03-01', '1492-03-05'),
    ];
    // At 1492-01-01, both bookings are in the future
    expect(getOccupiedRoomIds(bookings, '1492-01-01')).toEqual(new Set());
  });

  it('shows room as occupied on first day of booking', () => {
    const bookings = [booking(1, '1492-03-01', '1492-03-05')];
    expect(getOccupiedRoomIds(bookings, '1492-03-01')).toEqual(new Set([1]));
  });

  it('handles same room with sequential bookings', () => {
    const bookings = [
      booking(1, '1492-01-05', '1492-01-10', 1),  // paid/past
      booking(1, '1492-01-10', '1492-01-15'),       // current active
    ];
    expect(getOccupiedRoomIds(bookings, '1492-01-12')).toEqual(new Set([1]));
  });
});
