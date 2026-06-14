/**
 * formatDate("2026-05-06T...") → "6 May 2026"
 * formatTime("2026-05-06T06:30:00Z") → "06:30 AM"
 */

export const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatTime = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();
};
