/**
 * Quagga2 1.12+ emits GS1 FNC1 as ASCII 29 (Group Separator). Browsers draw
 * that control char as a box/icon after the real student id, so lookup fails
 * even though the same id works when typed or scanned in another app.
 */
const CONTROL_AND_INVISIBLE =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF\uFFFD]/g;

export function normalizeScannedCode(raw: string | null | undefined): string {
  if (!raw) return "";

  let code = raw.replace(CONTROL_AND_INVISIBLE, "").trim();
  // Drop leftover start/stop or decoder glyphs stuck to either end.
  code = code.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
  return code.trim();
}
