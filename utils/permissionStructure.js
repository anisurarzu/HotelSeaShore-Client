/**
 * World-class, standard permission structure for dynamic RBAC.
 * Use this on the frontend; align backend APIs with the contract below.
 */

// --- Standard resources (modules) ---
export const RESOURCES = {
  BOOKING: "booking",
  HOTEL: "hotel",
  USER: "user",
  AGENT: "agent",
  EXPENSE: "expense",
  REPORT: "report",
  DASHBOARD: "dashboard",
  SETTINGS: "settings",
};

// --- Standard actions (CRUD + manage) ---
export const ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage", // full access to resource
};

// --- Human-readable labels for UI ---
export const RESOURCE_LABELS = {
  [RESOURCES.BOOKING]: "Booking",
  [RESOURCES.HOTEL]: "Hotel",
  [RESOURCES.USER]: "User",
  [RESOURCES.AGENT]: "Agent",
  [RESOURCES.EXPENSE]: "Expense",
  [RESOURCES.REPORT]: "Report",
  [RESOURCES.DASHBOARD]: "Dashboard",
  [RESOURCES.SETTINGS]: "Settings",
};

export const ACTION_LABELS = {
  [ACTIONS.READ]: "View",
  [ACTIONS.CREATE]: "Create",
  [ACTIONS.UPDATE]: "Edit",
  [ACTIONS.DELETE]: "Delete",
  [ACTIONS.MANAGE]: "Full access",
};

/**
 * Build a permission key (e.g. "booking:read"). Backend should use same format.
 */
export function getPermissionKey(resource, action) {
  return `${resource}:${action}`;
}

/**
 * Parse permission key into { resource, action }.
 */
export function parsePermissionKey(key) {
  if (!key || typeof key !== "string") return null;
  const [resource, action] = key.split(":");
  return resource && action ? { resource, action } : null;
}

/**
 * Normalize API permission list for UI.
 * Supports:
 * - Legacy: { _id, permissionName }
 * - Standard: { _id, permissionKey, resource, action, permissionName, category }
 * Returns: { flat: [...], byResource: { booking: [...], ... } }
 */
export function normalizePermissions(apiList) {
  if (!Array.isArray(apiList)) return { flat: [], byResource: {} };

  const flat = apiList.map((p) => {
    const key = p.permissionKey || (p.resource && p.action ? getPermissionKey(p.resource, p.action) : null);
    return {
      _id: p._id,
      key: key,
      resource: p.resource || (key ? parsePermissionKey(key)?.resource : null),
      action: p.action || (key ? parsePermissionKey(key)?.action : null),
      permissionName: p.permissionName || p.name || key || p._id,
      category: p.category || p.resource,
    };
  });

  const byResource = {};
  flat.forEach((p) => {
    const r = p.resource || "other";
    if (!byResource[r]) byResource[r] = [];
    byResource[r].push(p);
  });

  return { flat, byResource };
}

/**
 * Check if a permission key is included in a list of permission keys or IDs.
 * When backend returns user.permissions as keys: ["booking:read", "hotel:manage"].
 */
export function hasPermission(userPermissions, requiredKeyOrId) {
  if (!userPermissions || !requiredKeyOrId) return false;
  const list = Array.isArray(userPermissions) ? userPermissions : [];
  return list.some((p) => {
    if (typeof p === "string") return p === requiredKeyOrId;
    return p?.permissionKey === requiredKeyOrId || p?._id === requiredKeyOrId;
  });
}

/**
 * Default role labels (align with backend roles).
 */
export const ROLE_KEYS = {
  AGENT_ADMIN: "agentadmin",
  SUPER_ADMIN: "superadmin",
  HOTEL_ADMIN: "hoteladmin",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLE_KEYS.AGENT_ADMIN]: "Agent Admin",
  [ROLE_KEYS.SUPER_ADMIN]: "Super Admin",
  [ROLE_KEYS.HOTEL_ADMIN]: "Hotel Admin",
  [ROLE_KEYS.ADMIN]: "Admin",
};

export function getRoleOptions() {
  return Object.entries(ROLE_LABELS).map(([value, label], index) => ({
    id: index + 1,
    value,
    label,
  }));
}
