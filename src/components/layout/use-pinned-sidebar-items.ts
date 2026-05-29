"use client";

import { useMemo, useSyncExternalStore } from "react";

const PINNED_SIDEBAR_EVENT = "articulab-sidebar-pinned-change";

function readPinnedSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function parsePinnedIds(snapshot: string) {
  try {
    const parsedPinnedIds = JSON.parse(snapshot);

    if (!Array.isArray(parsedPinnedIds)) {
      return [];
    }

    return parsedPinnedIds.filter(
      (value): value is string => typeof value === "string",
    );
  } catch {
    return [];
  }
}

function subscribeToPinnedIds(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PINNED_SIDEBAR_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PINNED_SIDEBAR_EVENT, onStoreChange);
  };
}

export function usePinnedSidebarItems(storageKey: string) {
  const pinnedSnapshot = useSyncExternalStore(
    subscribeToPinnedIds,
    () => readPinnedSnapshot(storageKey),
    () => "[]",
  );
  const pinnedIds = useMemo(
    () => parsePinnedIds(pinnedSnapshot),
    [pinnedSnapshot],
  );
  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  function togglePinnedId(id: string) {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((pinnedId) => pinnedId !== id)
      : [id, ...pinnedIds];

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(PINNED_SIDEBAR_EVENT));
    } catch {
      window.dispatchEvent(new Event(PINNED_SIDEBAR_EVENT));
    }
  }

  return { pinnedIds, pinnedIdSet, togglePinnedId };
}
