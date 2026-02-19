/**
 * Convert room type names to short acronym form
 * Example: "Deluxe Queen Room" -> "DQR"
 */
export function getRoomTypeShortForm(roomType: string): string {
  if (!roomType) return "";

  // Remove common words and get capital letters
  const shortForm = roomType
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return shortForm || roomType;
}

/**
 * Format room type data with short forms while preserving full name for tooltips
 */
export function formatRoomTypeData(
  data?: Record<string, { total: number; count: number }>,
): Array<{
  name: string;
  shortName: string;
  total: number;
  count: number;
}> {
  if (!data) return [];

  return Object.entries(data).map(([roomType, stats]) => ({
    name: roomType,
    shortName: getRoomTypeShortForm(roomType),
    total: stats.total,
    count: stats.count,
  }));
}
