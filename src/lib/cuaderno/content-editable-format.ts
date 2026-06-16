let savedRange: Range | null = null;

export function saveContentEditableSelection(root: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return;
  savedRange = range.cloneRange();
}

export function restoreContentEditableSelection() {
  if (!savedRange) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(savedRange);
}

export function applyContentEditableCommand(
  el: HTMLElement,
  cmd: "bold" | "italic" | "underline" | "foreColor",
  value?: string,
) {
  saveContentEditableSelection(el);
  el.focus();
  restoreContentEditableSelection();
  if (cmd === "foreColor") {
    document.execCommand("foreColor", false, value ?? "#1e293b");
  } else {
    document.execCommand(cmd);
  }
}
