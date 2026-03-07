"use client";

import { useDateFormat } from "@/contexts/DateFormatContext";

export function DateFormatToggle() {
  const { showDate, toggle } = useDateFormat();

  return (
    <button
      onClick={toggle}
      title={showDate ? "시간 형식으로 전환" : "날짜 형식으로 전환"}
      className="flex items-center rounded-full bg-gray-800 p-0.5 text-xs font-medium"
    >
      <span
        className={`rounded-full px-2.5 py-1 transition-colors ${
          !showDate ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        시간
      </span>
      <span
        className={`rounded-full px-2.5 py-1 transition-colors ${
          showDate ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        월일
      </span>
    </button>
  );
}
