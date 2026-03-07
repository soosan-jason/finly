"use client";

import { Clock, CalendarDays } from "lucide-react";
import { useDateFormat } from "@/contexts/DateFormatContext";

export function DateFormatToggle() {
  const { showDate, toggle } = useDateFormat();

  return (
    <button
      onClick={toggle}
      title={showDate ? "시간 형식으로 전환" : "날짜 형식으로 전환"}
      className="flex items-center rounded-full bg-gray-800 p-0.5"
    >
      <span
        className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
          !showDate ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        <Clock size={14} />
      </span>
      <span
        className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
          showDate ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        <CalendarDays size={14} />
      </span>
    </button>
  );
}
