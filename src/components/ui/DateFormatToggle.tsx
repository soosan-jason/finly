"use client";

import { Clock, CalendarDays } from "lucide-react";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";

export function DateFormatToggle() {
  const { showDate, toggle } = useDateFormat();
  const t = useT();

  return (
    <button
      onClick={toggle}
      title={showDate ? t("dateToggle.toTime") : t("dateToggle.toDate")}
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
