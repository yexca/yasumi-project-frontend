import type { QuickAddDefaultCapture } from "./ItemDialogs";

export function openQuickAdd(defaultCapture?: QuickAddDefaultCapture): void {
  window.dispatchEvent(new CustomEvent("yasumi:quick-add", { detail: defaultCapture }));
}
