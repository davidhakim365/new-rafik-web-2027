const CONFUSABLE_TO_DIGIT: Record<string, string> = {
  O: "0",
  I: "1",
  L: "1",
  S: "5",
  B: "8",
  Z: "2",
  G: "6",
};

function fixDigits(value: string): string {
  return value.replace(/[OILSBZG]/g, (ch) => CONFUSABLE_TO_DIGIT[ch] ?? ch);
}

function normalizeToken(token: string): string | null {
  const body = token.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (body.length < 6) return null;

  const oddLetters = body.replace(/[0-9OILSBZG]/g, "");
  if (oddLetters.length === 0) {
    const digits = fixDigits(body);
    return /^\d{6,}$/.test(digits) ? digits : null;
  }

  const digitCount = (body.match(/\d/g) ?? []).length;
  if (digitCount >= 4 && oddLetters.length <= 4) return body;
  return null;
}

/**
 * Pulls a student code out of the human-readable line printed under a barcode.
 * Accepts a numeric id, an ONL- id, or a short mixed code. Ignores names and
 * other words that OCR picks up around the label.
 */
export function extractPrintedCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();

  const onl = upper.match(/[O0]\s*N\s*[LI1]\s*-?\s*([0-9OILSBZG\s-]{6,})/);
  if (onl) {
    const digits = fixDigits(onl[1]).replace(/\D/g, "");
    if (digits.length >= 6) return `ONL-${digits}`;
  }

  const tokens = upper.split(/[^A-Z0-9-]+/).filter(Boolean);
  let bestNumeric = "";
  let bestMixed = "";
  for (const token of tokens) {
    const code = normalizeToken(token);
    if (!code) continue;
    if (/^\d{6,}$/.test(code)) {
      if (code.length > bestNumeric.length) bestNumeric = code;
    } else if (code.length > bestMixed.length) {
      bestMixed = code;
    }
  }

  return bestNumeric || bestMixed || null;
}
