"use client";

import { useDateFormat } from "@/contexts/DateFormatContext";

const TIMEZONES = [
  { value: "Asia/Seoul",       label: "KST — 서울 (UTC+9)" },
  { value: "Asia/Tokyo",       label: "JST — 도쿄 (UTC+9)" },
  { value: "Asia/Shanghai",    label: "CST — 상하이 (UTC+8)" },
  { value: "UTC",              label: "UTC — 협정 세계시 (UTC+0)" },
  { value: "Europe/London",    label: "GMT/BST — 런던" },
  { value: "Europe/Berlin",    label: "CET — 베를린 (UTC+1)" },
  { value: "America/New_York", label: "EST/EDT — 뉴욕" },
  { value: "America/Chicago",  label: "CST/CDT — 시카고" },
  { value: "America/Los_Angeles", label: "PST/PDT — 로스앤젤레스" },
];

export function TimezoneSelect() {
  const { timezone, setTimezone } = useDateFormat();

  return (
    <select
      value={timezone}
      onChange={(e) => setTimezone(e.target.value)}
      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {TIMEZONES.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
