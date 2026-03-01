"use client";

import { createContext, useContext, useMemo } from "react";
import { getKeyByPageName, getAllPageKeys } from "@/config/dashboardPages";

// Super admin role values that see everything (configurable)
const FULL_ACCESS_ROLES = ["superadmin", "super admin", "agentadmin"];

const PermissionContext = createContext(null);

/**
 * Resolve allowed page keys and content permission for a page from user's permission document.
 * permission = { permissionName, permissions: [ { pageKey?, pageName?, viewAccess, insertAccess, editAccess, deleteAccess } ] }
 */
function resolveFromPermission(permission, isRestaurant) {
  const allKeys = getAllPageKeys(isRestaurant);
  if (!permission?.permissions?.length) {
    return { allowedPageKeys: allKeys, getContentPermission: () => ({ view: true, insert: true, edit: true, delete: true }) };
  }

  const byKey = {};
  permission.permissions.forEach((p) => {
    const key = p.pageKey || getKeyByPageName(p.pageName);
    if (!key) return;
    byKey[key] = {
      view: !!p.viewAccess,
      insert: !!p.insertAccess,
      edit: !!p.editAccess,
      delete: !!p.deleteAccess,
    };
  });

  const allowedPageKeys = permission.permissions
    .filter((p) => p.viewAccess)
    .map((p) => p.pageKey || getKeyByPageName(p.pageName))
    .filter(Boolean);
  const allowedSet = new Set(allowedPageKeys.length ? allowedPageKeys : allKeys);

  const getContentPermission = (pageKey) => {
    if (!pageKey) return { view: true, insert: true, edit: true, delete: true };
    const c = byKey[pageKey];
    if (c) return c;
    return { view: false, insert: false, edit: false, delete: false };
  };

  return {
    allowedPageKeys: allKeys.filter((k) => allowedSet.has(k)),
    getContentPermission,
  };
}

export function PermissionProvider({ children, userInfo, isRestaurant = false }) {
  const value = useMemo(() => {
    const roleValue = userInfo?.role?.value ?? userInfo?.role ?? "";
    const isFullAccess = FULL_ACCESS_ROLES.some(
      (r) => String(roleValue).toLowerCase() === r.toLowerCase()
    );

    if (isFullAccess) {
      const allKeys = getAllPageKeys(isRestaurant);
      return {
        userInfo,
        isRestaurant,
        allowedPageKeys: allKeys,
        getContentPermission: () => ({ view: true, insert: true, edit: true, delete: true }),
        isFullAccess: true,
      };
    }

    const permission = userInfo?.permission ?? userInfo?.permissions;
    const { allowedPageKeys, getContentPermission } = resolveFromPermission(
      permission,
      isRestaurant
    );

    return {
      userInfo,
      isRestaurant,
      allowedPageKeys,
      getContentPermission,
      isFullAccess: false,
    };
  }, [userInfo, isRestaurant]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  return ctx || {
    allowedPageKeys: [],
    getContentPermission: () => ({ view: true, insert: true, edit: true, delete: true }),
    isFullAccess: true,
  };
}

/** Resolve permissions from userInfo without context (e.g. for dashboard menu filter). */
export function useResolvedPermission(userInfo, isRestaurant = false) {
  return useMemo(() => {
    const roleValue = userInfo?.role?.value ?? userInfo?.role ?? "";
    const isFullAccess = FULL_ACCESS_ROLES.some(
      (r) => String(roleValue).toLowerCase() === r.toLowerCase()
    );
    if (isFullAccess) {
      const allKeys = getAllPageKeys(isRestaurant);
      return {
        allowedPageKeys: allKeys,
        getContentPermission: () => ({ view: true, insert: true, edit: true, delete: true }),
        isFullAccess: true,
      };
    }
    const permission = userInfo?.permission ?? userInfo?.permissions;
    return { ...resolveFromPermission(permission, isRestaurant), isFullAccess: false };
  }, [userInfo, isRestaurant]);
}
