"use client";

import { useEffect } from "react";

/**
 * Chrome Android / Samsung Internet의 수평 엣지 스와이프 뒤로가기/앞으로가기 제스처를 차단.
 *
 * 전략:
 * touchmove에서만 수평 스와이프를 감지 → 스크롤 여지 있는 조상이 없으면 preventDefault.
 * (touchstart에서는 preventDefault하지 않음: 호출 시 브라우저가 스크롤 추적을 시작하지
 *  못해 화면이 튀는 현상이 발생하기 때문.)
 */
export function SwipeNavigationGuard() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const dx    = e.touches[0].clientX - startX;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.touches[0].clientY - startY);

      if (absDx < 3) return;
      if (absDy > absDx * 1.5) return; // 세로 스와이프가 1.5배 이상 → 통과

      // 수평 스와이프: 스크롤 여지 있는 조상이면 허용
      let el = e.target as HTMLElement | null;
      while (el && el !== document.body) {
        const ox = window.getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") {
          const atLeft  = el.scrollLeft <= 0;
          const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
          if (dx < 0 && !atRight) return;
          if (dx > 0 && !atLeft)  return;
        }
        el = el.parentElement;
      }

      e.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true,  capture: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false, capture: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchmove",  onTouchMove,  { capture: true });
    };
  }, []);

  return null;
}
