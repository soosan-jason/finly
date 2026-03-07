"use client";

import { useDateFormat } from "@/contexts/DateFormatContext";
import { getT, TranslationKey } from "./index";

/** 현재 locale에 맞는 번역 함수를 반환합니다. */
export function useT() {
  const { locale } = useDateFormat();
  return getT(locale);
}

export type { TranslationKey };
