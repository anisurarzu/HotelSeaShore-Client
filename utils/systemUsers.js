/** Hidden system accounts — keep out of all user lists / pickers. */
const HIDDEN_LOGIN_IDS = new Set(["HSS-SUPER", "HSS-SUPER".toLowerCase()]);

export function isHiddenSystemUser(user) {
  if (!user || typeof user !== "object") return false;
  if (user.isSystemUser === true) return true;

  const loginID = String(user.loginID || user.loginId || "").trim();
  if (!loginID) return false;
  if (HIDDEN_LOGIN_IDS.has(loginID) || HIDDEN_LOGIN_IDS.has(loginID.toLowerCase())) {
    return true;
  }

  const username = String(user.username || "").trim().toLowerCase();
  if (username === "systemsuperadmin") return true;

  return false;
}

export function filterVisibleUsers(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => !isHiddenSystemUser(u));
}
