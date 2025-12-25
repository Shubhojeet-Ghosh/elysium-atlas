export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Formats UTC date string with microseconds to local 12-hour format with AM/PM
export const formatDateTime12hr = (dateString: string) => {
  // Remove microseconds if present and ensure UTC parsing
  // Example: "2025-12-25T16:03:40.203000" => "2025-12-25T16:03:40.203Z"
  let cleaned = dateString.replace(/\.(\d{3})\d+$/, ".$1");
  if (!cleaned.endsWith("Z")) cleaned += "Z";
  const utcDate = new Date(cleaned);
  return utcDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
