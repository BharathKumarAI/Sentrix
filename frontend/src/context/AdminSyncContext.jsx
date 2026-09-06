import React, { createContext, useContext, useEffect, useCallback } from "react";

const AdminSyncContext = createContext({
  emitSync: () => {},
});

const SYNC_EVENT_NAME = "sentrix:admin-sync";
const SYNC_STORAGE_KEY = "sentrix_admin_last_sync";

export function emitAdminSync(type, payload = {}) {
  const detail = { type, payload, timestamp: Date.now() };
  // 1. Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail }));
  // 2. Dispatch localStorage write for cross-tab / cross-window sync
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(detail));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export function AdminSyncProvider({ children, onSync }) {
  const handleSyncEvent = useCallback((detail) => {
    if (onSync) {
      onSync(detail);
    }
  }, [onSync]);

  useEffect(() => {
    // Listen for custom event in same tab
    const handleCustomEvent = (e) => {
      handleSyncEvent(e.detail);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleCustomEvent);

    // Listen for storage event across tabs
    const handleStorageEvent = (e) => {
      if (e.key === SYNC_STORAGE_KEY && e.newValue) {
        try {
          const detail = JSON.parse(e.newValue);
          handleSyncEvent(detail);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [handleSyncEvent]);

  return (
    <AdminSyncContext.Provider value={{ emitSync: emitAdminSync }}>
      {children}
    </AdminSyncContext.Provider>
  );
}

/**
 * Hook for any admin page to subscribe to platform-wide synchronization events.
 * Triggered whenever a project is created, plugin toggled, key rotated, or policy changed.
 */
export function useAdminSync(onSyncCallback) {
  useEffect(() => {
    if (!onSyncCallback) return;

    const handleCustomEvent = (e) => {
      onSyncCallback(e.detail);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleCustomEvent);

    const handleStorageEvent = (e) => {
      if (e.key === SYNC_STORAGE_KEY && e.newValue) {
        try {
          const detail = JSON.parse(e.newValue);
          onSyncCallback(detail);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [onSyncCallback]);

  return { emitSync: emitAdminSync };
}
