"use client";

import { useDateFormat } from "@/contexts/DateFormatContext";

const LOCALES = [
  { value: "ko-KR", label: "한국어" },
  { value: "en-US", label: "English (US)" },
  { value: "ja-JP", label: "日本語" },
  { value: "zh-CN", label: "中文 (简体)" },
];

export function LanguageSelect() {
  const { locale, setLocale } = useDateFormat();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {LOCALES.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
