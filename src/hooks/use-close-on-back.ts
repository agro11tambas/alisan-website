"use client";

import { useEffect, useRef } from "react";

const OVERLAY_KEY = "__overlayId";

/**
 * Makes the mobile back button/gesture close an overlay instead of leaving the page.
 *
 * While the overlay is open an extra history entry is pushed (same URL, so the
 * Next.js router just restores the current tree). Popping that entry closes the
 * overlay; closing it any other way removes the entry again so the history stack
 * stays clean.
 *
 * Nested overlays work because each entry carries its own id: a popstate only
 * closes the overlay whose entry actually disappeared.
 */
export function useCloseOnBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const isCurrentEntry = () =>
      (window.history.state as Record<string, unknown> | null)?.[OVERLAY_KEY] === id;

    window.history.pushState({ [OVERLAY_KEY]: id }, "");

    const handlePopState = () => {
      // Still our entry: the pop belonged to an overlay stacked on top of this one.
      if (isCurrentEntry()) return;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Closed by the UI (not by back), so drop the entry we pushed. Skipped when a
      // real navigation already replaced it, otherwise we would undo that navigation.
      if (isCurrentEntry()) window.history.back();
    };
  }, [isOpen]);
}
