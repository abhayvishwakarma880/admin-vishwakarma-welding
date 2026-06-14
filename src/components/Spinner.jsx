import { useTheme } from "../context/ThemeContext";

export default function Spinner({ size = 20, color }) {
  const { themeColors } = useTheme();
  return (
    <div
      className="animate-spin rounded-full border-2 border-t-transparent flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderColor: color || themeColors.primary,
        borderTopColor: "transparent",
      }}
    />
  );
}
