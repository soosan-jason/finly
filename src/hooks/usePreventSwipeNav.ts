import { useRef } from "react";

// 스와이프 차단은 globals.css overscroll-behavior-x: none 으로 처리.
// 이 훅은 기존 ref 호환성 유지를 위해 단순 ref를 반환합니다.
export function usePreventSwipeNav<T extends HTMLElement = HTMLDivElement>() {
  return useRef<T>(null);
}
