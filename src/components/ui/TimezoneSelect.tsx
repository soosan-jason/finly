"use client";

import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";

const TZ_VALUES = [
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
] as const;

export function TimezoneSelect() {
  const { timezone, setTimezone } = useDateFormat();
  const t = useT();

  return (
    <select
      value={timezone}
      onChange={(e) => setTimezone(e.target.value)}
      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {TZ_VALUES.map((value) => (
        <option key={value} value={value}>
          {t(`tz.${value}` as Parameters<typeof t>[0])}
        </option>
      ))}
    </select>
  );
}
