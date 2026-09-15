/** Extract a positive numeric hotelID from URL/user/hotel payloads. */
export function extractHotelId(value) {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  if (Array.isArray(value) && value.length > 0) {
    return extractHotelId(value[0]?.hotelID ?? value[0]?.hotelId ?? value[0]);
  }

  if (typeof value === "object") {
    return extractHotelId(value.hotelID ?? value.hotelId);
  }

  return null;
}

/** Prefer URL hotelID, then userInfo.hotelID (supports [{ hotelID }]). */
export function resolveDashboardHotelId(urlHotelID, userInfo) {
  return (
    extractHotelId(urlHotelID) ??
    extractHotelId(userInfo?.hotelID) ??
    extractHotelId(userInfo?.hotelId) ??
    null
  );
}

/** Pull hotels array from common API response shapes. */
export function unwrapHotels(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  if (Array.isArray(payload?.data?.hotels)) return payload.data.hotels;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
