/** Normalize GET /bookings response (array or { data }). */
export function unwrapBookings(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/** Build /bookings?... with only defined params. */
export function buildBookingsPath(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    q.set(key, String(value));
  });
  const qs = q.toString();
  return qs ? `/bookings?${qs}` : "/bookings";
}
