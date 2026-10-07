/**
 * Turns math notation in passages, questions, and coaching into speakable English
 * for Azure TTS (all practice domains).
 *
 * Decimals are read digit-by-digit after "point" (2.6457 → "two point six four five seven").
 */

const DIGIT_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
] as const;

const TEENS = [
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
] as const;

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
] as const;

const ORDINAL_DENOMS: Record<number, [string, string]> = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["fourth", "fourths"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
};

function speakDigits(digits: string): string {
  return digits
    .split("")
    .filter((d) => /\d/.test(d))
    .map((d) => DIGIT_WORDS[Number(d)] ?? d)
    .join(" ");
}

/** Integers 0–9999 for math contexts (quantities, roots, whole parts of decimals). */
export function speakInteger(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return `negative ${speakInteger(-n)}`;
  if (n === 0) return "zero";

  const parts: string[] = [];

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    parts.push(`${speakInteger(thousands)} thousand`);
    n %= 1000;
  }

  if (n >= 100) {
    parts.push(`${DIGIT_WORDS[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }

  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
    if (n > 0) parts.push(DIGIT_WORDS[n]);
  } else if (n >= 10) {
    parts.push(TEENS[n - 10]);
  } else if (n > 0) {
    parts.push(DIGIT_WORDS[n]);
  }

  return parts.join(" ");
}

function speakDecimal(whole: string, fraction: string, repeating = false): string {
  const wholeNum = parseInt(whole, 10);
  const wholeSpoken = Number.isNaN(wholeNum) ? whole : speakInteger(wholeNum);
  const fracSpoken = speakDigits(fraction);
  const base = fracSpoken ? `${wholeSpoken} point ${fracSpoken}` : wholeSpoken;
  return repeating ? `${base}, and so on` : base;
}

function speakFraction(numerator: number, denominator: number): string {
  const ord = ORDINAL_DENOMS[denominator];
  if (numerator === 1 && ord) return `one ${ord[0]}`;
  if (ord) return `${speakInteger(numerator)} ${numerator === 1 ? ord[0] : ord[1]}`;
  return `${speakInteger(numerator)} over ${speakInteger(denominator)}`;
}

function replaceFractions(text: string): string {
  return text.replace(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/g, (match, num, den) => {
    const n = parseInt(num, 10);
    const d = parseInt(den, 10);
    if (d === 0 || d > 100) return match;
    return speakFraction(n, d);
  });
}

function replaceDecimals(text: string): string {
  let out = text;
  // 2.6457… or 2.6457... (no trailing \b — word boundary fails after dots)
  out = out.replace(
    /\b(\d{1,6})\.(\d+)(?:\.{2,}|…+)/g,
    (_, whole, frac) => speakDecimal(whole, frac, true),
  );
  // 2.6457, 0.5, 12.34
  out = out.replace(
    /\b(\d{1,6})\.(\d+)\b/g,
    (_, whole, frac) => speakDecimal(whole, frac, false),
  );
  return out;
}

function replaceMathSymbols(text: string): string {
  let out = text;

  out = out.replace(/√\s*\(([^)]+)\)/g, "square root of $1");
  out = out.replace(/√\s*([\d.]+)/g, "square root of $1");
  out = out.replace(/π/g, "pi");
  out = out.replace(/±/g, " plus or minus ");
  out = out.replace(/×|·/g, " times ");
  out = out.replace(/÷/g, " divided by ");
  out = out.replace(/≤/g, " less than or equal to ");
  out = out.replace(/≥/g, " greater than or equal to ");
  out = out.replace(/≈|≅/g, " approximately equal to ");
  out = out.replace(/≠/g, " not equal to ");
  out = out.replace(/∞/g, " infinity ");
  out = out.replace(/(\d+)\s*°/g, "$1 degrees");
  out = out.replace(/(\d+)\s*%/g, (_, n) => `${speakInteger(parseInt(n, 10))} percent`);

  out = out.replace(/(\d+)²/g, (_, n) => `${speakInteger(parseInt(n, 10))} squared`);
  out = out.replace(/(\d+)³/g, (_, n) => `${speakInteger(parseInt(n, 10))} cubed`);
  out = out.replace(/\^2\b/g, " squared");
  out = out.replace(/\^3\b/g, " cubed");

  out = out.replace(/\b(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\b/g, (_, a, b) => `${a} equals ${b}`);
  out = out.replace(/\b(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\b/g, (_, a, b) => `${a} plus ${b}`);
  out = out.replace(/\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\b/g, (_, a, b) => `${a} minus ${b}`);

  out = out.replace(/(?<![\d.])(\.\.\.|…)(?![\d.])/g, " and so on ");

  return out.replace(/\s+/g, " ");
}

/**
 * Convert math notation in student-facing text to natural spoken English.
 * Safe to run on passages, MC options, questions, and coaching (keeps *stress* markers).
 */
export function speakMathNotation(text: string): string {
  if (!text.trim()) return text;

  let out = text;
  out = replaceMathSymbols(out);
  out = replaceFractions(out);
  out = replaceDecimals(out);

  // Square roots written in words: "square root of 7" → "square root of seven"
  out = out.replace(
    /\bsquare\s+root\s+of\s+(\d{1,6})\b/gi,
    (_, n) => `square root of ${speakInteger(parseInt(n, 10))}`,
  );

  return out.replace(/\s+/g, " ").trim();
}
