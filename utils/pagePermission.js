/**
 * Get page-wise permission from localStorage userInfo.
 * userInfo.permission.permissions[] has { pageName, viewAccess, insertAccess, editAccess, deleteAccess }.
 * Use when component is not receiving contentPermissions from dashboard (e.g. fallback).
 */
export function getPagePermissionFromStorage(pageNames = []) {
  if (typeof window === "undefined") {
    return { viewAccess: true, insertAccess: true, editAccess: true, deleteAccess: true };
  }
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return { viewAccess: true, insertAccess: true, editAccess: true, deleteAccess: true };
    const userInfo = JSON.parse(raw);
    const permissions = userInfo?.permission?.permissions;
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return { viewAccess: true, insertAccess: true, editAccess: true, deleteAccess: true };
    }
    const names = Array.isArray(pageNames) ? pageNames : [pageNames];
    const found = permissions.find((p) => p && names.includes(p.pageName));
    if (!found) {
      return { viewAccess: false, insertAccess: false, editAccess: false, deleteAccess: false };
    }
    return {
      viewAccess: !!found.viewAccess,
      insertAccess: !!found.insertAccess,
      editAccess: !!found.editAccess,
      deleteAccess: !!found.deleteAccess,
    };
  } catch (e) {
    return { viewAccess: true, insertAccess: true, editAccess: true, deleteAccess: true };
  }
}

/**
 * Normalize contentPermissions from dashboard (view/insert/edit/delete) to viewAccess/insertAccess/etc.
 */
export function normalizeContentPermissions(cp) {
  if (!cp) return { viewAccess: true, insertAccess: true, editAccess: true, deleteAccess: true };
  return {
    viewAccess: cp.viewAccess ?? cp.view,
    insertAccess: cp.insertAccess ?? cp.insert,
    editAccess: cp.editAccess ?? cp.edit,
    deleteAccess: cp.deleteAccess ?? cp.delete,
  };
}
