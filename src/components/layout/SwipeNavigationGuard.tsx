"use client";

import { useEffect } from "react";

/**
 * 수평 스와이프로 브라우저 뒤로가기/앞으로가기가 트리거되는 현상을 방지.
 * - 수평 스와이프 시 해당 요소(또는 조상)가 아직 스크롤 가능한 경우 → 스크롤 허용
 * - 스크롤 여지가 없는 영역에서의 수평 스와이프 → preventDefault로 네비게이션 차단
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

      // 노이즈 제거: 3px 미만 무시
      if (absDx < 3) return;
      // 세로 이동이 수평의 1.2배 이상이면 세로 스와이프로 판단 → 통과
      if (absDy > absDx * 1.2) return;

      // 수평 스와이프 감지: 스크롤 가능한 조상이 해당 방향으로 여유가 있으면 허용
      let el = e.target as HTMLElement | null;
      while (el && el !== document.body) {
        const ox = window.getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") {
          const atLeft  = el.scrollLeft <= 0;
          const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
          if (dx < 0 && !atRight) return; // 왼쪽 스와이프, 오른쪽으로 스크롤 여지 있음
          if (dx > 0 && !atLeft)  return; // 오른쪽 스와이프, 왼쪽으로 스크롤 여지 있음
        }
        el = el.parentElement;
      }

      // 스크롤 컨텍스트 없음 또는 경계 도달 → 브라우저 네비게이션 제스처 차단
      e.preventDefault();
    };

    // capture: true → stopPropagation()으로 막힌 이벤트도 확실히 수신
    document.addEventListener("touchstart", onTouchStart, { passive: true,  capture: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false, capture: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchmove",  onTouchMove,  { capture: true });
    };
  }, []);

  return null;
}
