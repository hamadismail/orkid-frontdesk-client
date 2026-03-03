import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime } from "date-fns-tz"
import { startOfDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeToMalaysiaMidnight(date: Date | string | number): Date {
  const timeZone = 'Asia/Kuala_Lumpur';
  // 1. Convert the input to a Date object in the target timezone
  const zonedDate = toZonedTime(date, timeZone);
  // 2. Get the start of the day in that timezone
  const midnightZoned = startOfDay(zonedDate);
  // 3. This returns a Date object which, when converted to string/JSON, 
  // represents that midnight in UTC. 
  // For Malaysia (UTC+8), midnight is 16:00 of the previous day in UTC.
  return midnightZoned;
}
