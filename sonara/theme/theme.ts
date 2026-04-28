import { colors } from "./colors";

export const theme = {
  colors,

  spacing: (factor: number) => factor * 8,

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  typography: {
    title: {
      fontSize: 22,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    meta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  },
};
