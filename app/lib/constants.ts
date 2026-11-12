export const BUTTON_STYLES = ["solid", "soft", "outline"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];

export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  solid: "Solid cards",
  soft: "Frosted glass",
  outline: "Outline only",
};

export const PAGE_MAX_WIDTH = "max-w-md";
