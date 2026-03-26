/**
 * Read `userInfo` from localStorage (set by your auth flow).
 * Returns `null` if not available or parsing fails.
 */
export function getUserInfoFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed || null;
  } catch (e) {
    return null;
  }
}

