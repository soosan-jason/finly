"use client";

import { createContext, useContext, useState, useEffect } from "react";

type DateFormatCtx = {
  showDate: boolean;
  toggle: () => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
};

const DateFormatContext = createContext<DateFormatCtx>({
  showDate: false,
  toggle: () => {},
  timezone: "Asia/Seoul",
  setTimezone: () => {},
  locale: "ko-KR",
  setLocale: () => {},
});

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [showDate, setShowDate] = useState(false);
  const [timezone, setTimezoneState] = useState("Asia/Seoul");
  const [locale, setLocaleState] = useState("ko-KR");

  useEffect(() => {
    setShowDate(localStorage.getItem("ts-format") === "date");
    setTimezoneState(localStorage.getItem("timezone") ?? "Asia/Seoul");
    setLocaleState(localStorage.getItem("locale") ?? "ko-KR");
  }, []);

  function toggle() {
    setShowDate((prev) => {
      const next = !prev;
      localStorage.setItem("ts-format", next ? "date" : "time");
      return next;
    });
  }

  function setTimezone(tz: string) {
    localStorage.setItem("timezone", tz);
    setTimezoneState(tz);
  }

  function setLocale(loc: string) {
    localStorage.setItem("locale", loc);
    setLocaleState(loc);
  }

  return (
    <DateFormatContext.Provider value={{ showDate, toggle, timezone, setTimezone, locale, setLocale }}>
      {children}
    </DateFormatContext.Provider>
  );
}

export const useDateFormat = () => useContext(DateFormatContext);
