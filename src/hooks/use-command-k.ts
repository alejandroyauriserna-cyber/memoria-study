"use client";

import { useEffect, type RefObject } from "react";

export const MS_FOCUS_SEARCH_EVENT = "ms:focus-search";

export function useCommandK(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function focusSearch() {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.select();
      input.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(MS_FOCUS_SEARCH_EVENT, focusSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(MS_FOCUS_SEARCH_EVENT, focusSearch);
    };
  }, [inputRef]);
}

export function dispatchFocusSearch() {
  window.dispatchEvent(new Event(MS_FOCUS_SEARCH_EVENT));
}
