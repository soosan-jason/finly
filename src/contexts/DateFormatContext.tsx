"use client";

import { createContext, useContext, useState, useEffect } from "react";

type DateFormatCtx = {
  showDate: boolean;
  toggle: () => void;
};

const DateFormatContext = createContext<DateFormatCtx>({
  showDate: false,
  toggle: () => {},
});

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    setShowDate(localStorage.getItem("ts-format") === "date");
  }, []);

  function toggle() {
    setShowDate((prev) => {
      const next = !prev;
      localStorage.setItem("ts-format", next ? "date" : "time");
      return next;
    });
  }

  return (
    <DateFormatContext.Provider value={{ showDate, toggle }}>
      {children}
    </DateFormatContext.Provider>
  );
}

export const useDateFormat = () => useContext(DateFormatContext);
