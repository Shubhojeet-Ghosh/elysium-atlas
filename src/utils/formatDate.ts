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
  // Remove microseconds if present
  // Example: "2025-12-25T16:03:40.203000" => "2025-12-25T16:03:40.203Z"
  // Also handles timezone offsets like "+00:00" or "+05:30"
  let cleaned = dateString.replace(
    /\.?(\d{3})\d*(?=[Z+-]|$)/,
    (match, ms, offset, str) => {
      // keep only 3ms digits
      return "." + ms;
    },
  );
  // Strip trailing microseconds more reliably
  cleaned = dateString.replace(/\.(\d{3})\d+/, ".$1");
  // Only append Z if there is no existing timezone info
  const hasTimezone = /[Z]$|(\+|-)\d{2}:\d{2}$/.test(cleaned);
  if (!hasTimezone) cleaned += "Z";
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

// Formats timestamp for chat messages with relative dates
export const formatChatTimestamp = (dateString: string) => {
  let cleaned = dateString.replace(/\.(\d{3})\d+$/, ".$1");
  if (!cleaned.endsWith("Z")) cleaned += "Z";
  const utcDate = new Date(cleaned);

  // Date object automatically converts to local time for getter methods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    utcDate.getFullYear(),
    utcDate.getMonth(),
    utcDate.getDate(),
  );

  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const hours = utcDate.getHours().toString().padStart(2, "0");
  const minutes = utcDate.getMinutes().toString().padStart(2, "0");

  if (diffDays === 0) {
    // Today
    return `Today ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    // Yesterday
    return `Yesterday ${hours}:${minutes}`;
  } else {
    // Older dates
    const month = utcDate.toLocaleDateString(undefined, { month: "short" });
    const day = utcDate.getDate();
    return `${month} ${day}, ${hours}:${minutes}`;
  }
};
