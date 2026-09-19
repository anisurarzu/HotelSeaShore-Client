/** Booking statusID conventions */
export const BOOKING_STATUS = {
  ACTIVE: 1,
  CHECKED_IN: 2,
  CHECKED_OUT: 3,
  CANCELLED: 4, // visible in lists, red UI; does not occupy rooms
  DELETED: 255, // soft-deleted; hidden from UI everywhere
};

export function bookingStatusId(bookingOrStatus) {
  if (bookingOrStatus == null) return null;
  if (typeof bookingOrStatus === "object") {
    return Number(bookingOrStatus.statusID);
  }
  return Number(bookingOrStatus);
}

/** Cancelled but still visible in Booking Info */
export function isCancelledBooking(booking) {
  return bookingStatusId(booking) === BOOKING_STATUS.CANCELLED;
}

/** Soft-deleted — must never appear in UI lists */
export function isDeletedBooking(booking) {
  return bookingStatusId(booking) === BOOKING_STATUS.DELETED;
}

/** Counts toward room occupancy / overlap */
export function isOccupyingBooking(booking) {
  const s = bookingStatusId(booking);
  return (
    Number.isFinite(s) &&
    s !== BOOKING_STATUS.CANCELLED &&
    s !== BOOKING_STATUS.DELETED
  );
}

export function bookingStatusLabel(booking) {
  const s = bookingStatusId(booking);
  if (s === BOOKING_STATUS.CANCELLED) return "Cancelled";
  if (s === BOOKING_STATUS.DELETED) return "Deleted";
  if (s === BOOKING_STATUS.CHECKED_IN) return "Checked in";
  if (s === BOOKING_STATUS.CHECKED_OUT) return "Checked out";
  return "Active";
}
