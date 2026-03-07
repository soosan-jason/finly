"use client";

import { useEffect } from "react";

/**
 * Chrome Android / Samsung Internet의 수평 엣지 스와이프 뒤로가기/앞으로가기 제스처를 차단.
 *
 * 전략:
 * 1. touchstart: 화면 양쪽 30px 이내에서 시작된 터치 → 즉시 preventDefault (엣지 제스처 차단)
 * 2. touchmove:  수평 스와이프 감지 → 스크롤 여지 있는 조상이 없으면 preventDefault
 */
export function SwipeNavigationGuard() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let blockMove = false; // touchstart에서 이미 차단 결정된 경우

    const EDGE_THRESHOLD = 30; // px, 화면 엣지로부터의 거리

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;

      // 화면 좌우 엣지 근처에서 시작된 터치 → 브라우저 스와이프 제스처 원천 차단
      if (t.clientX < EDGE_THRESHOLD || t.clientX > window.innerWidth - EDGE_THRESHOLD) {
        blockMove = true;
        e.preventDefault();
      } else {
        blockMove = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (blockMove) { e.preventDefault(); return; }

      const dx    = e.touches[0].clientX - startX;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.touches[0].clientY - startY);

      if (absDx < 3) return;
      if (absDy > absDx * 1.2) return; // 세로 스와이프 → 통과

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

    const onTouchEnd = () => { blockMove = false; };

    // touchstart도 passive:false 로 등록해야 preventDefault() 가 동작함
    document.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false, capture: true });
    document.addEventListener("touchend",   onTouchEnd,   { passive: true,  capture: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchmove",  onTouchMove,  { capture: true });
      document.removeEventListener("touchend",   onTouchEnd,   { capture: true });
    };
  }, []);

  return null;
}
