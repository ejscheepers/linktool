/**
 * Small colour helpers used to keep the public page readable no matter what
 * branding colours the owner picks.
 */

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "").trim();
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const int = Number.parseInt(normalized || "ffffff", 16);
  if (Number.isNaN(int)) return [255, 255, 255];
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Dark ink on light backgrounds, near-white ink on dark ones. */
export function readableInk(hex: string): string {
  return luminance(hex) > 0.45 ? "#0f172a" : "#f8fafc";
}

export function isDark(hex: string): boolean {
  return luminance(hex) <= 0.45;
}

export function initials(value: string): string {
  const clean = value.trim();
  if (!clean) return "?";
  return clean.slice(0, 1).toUpperCase();
}
