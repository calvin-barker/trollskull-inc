import { dateToAbsDay } from './calendar';

export type BookingRecord = {
  room_id: number;
  check_in: string;
  check_out: string;
  paid: number;
};

/** Return the set of room IDs that are currently occupied (unpaid booking overlapping currentDate) */
export function getOccupiedRoomIds(bookings: BookingRecord[], currentDate: string): Set<number> {
  const currentAbs = dateToAbsDay(currentDate);
  return new Set(
    bookings
      .filter(b => {
        if (b.paid) return false;
        const checkInAbs = dateToAbsDay(b.check_in);
        const checkOutAbs = dateToAbsDay(b.check_out);
        return checkInAbs <= currentAbs && checkOutAbs > currentAbs;
      })
      .map(b => b.room_id)
  );
}
