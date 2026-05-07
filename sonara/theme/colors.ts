// Dark theme
export const colors = {
  background: "#1B3C53",
  surface: "#234C6A",
  surfaceElevated: "#456882",
  player: "#D2C1B6",
  active: "#D2C1B6",
  inactive: "#8a9aaa",
  textPrimary: "#D2C1B6",
  textSecondary: "#b8a89d",
  textMuted: "#8a9aaa",
  border: "#2d5475",
};

export const lightColors = {
  background: "#FFF0BE",
  surface: "#FFD6A6",
  surfaceElevated: "#FFB399",
  player: "#FF9A86",
  active: "#FF9A86",
  inactive: "#d9876f",
  textPrimary: "#2a1810",
  textSecondary: "#5a3a2a",
  textMuted: "#8a6a5a",
  border: "#e6c299",
};

export const gradients = [
  ["#D2C1B6", "#234C6A"],
  ["#456882", "#1B3C53"],
  ["#D2C1B6", "#2d5475"],
  ["#456882", "#234C6A"],
  ["#D2C1B6", "#1B3C53"],
  ["#456882", "#0f1820"],
] as const;

export const heroGradient = ["#456882", "#1B3C53"] as const;
