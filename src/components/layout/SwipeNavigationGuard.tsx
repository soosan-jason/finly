"use client";

import { useEffect } from "react";

/**
 * Chrome Android의 수평 스와이프 뒤로가기/앞으로가기 제스처 차단.
 * 수평 터치가 감지될 때, 가로 스크롤 가능한 부모가 없으면 preventDefault()로 차단.
 */
export function SwipeNavigationGuard() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;
    }

    function onTouchMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // 방향이 아직 결정되지 않았으면 판단
      if (isHorizontal === null) {
        if (Math.abs(dx) > Math.abs(dy) + 3) {
          isHorizontal = true;
        } else if (Math.abs(dy) > Math.abs(dx) + 3) {
          isHorizontal = false;
        } else {
          return; // 아직 판단 불가
        }
      }

      if (!isHorizontal) return;

      // 수평 제스처 → 터치 대상이 가로 스크롤 가능한 영역 안에 있는지 확인
      const target = e.target as Element | null;
      if (hasHorizontalScroll(target)) return; // 테이블 등 스크롤 영역 → 허용

      // 가로 스크롤 불가 영역에서의 수평 스와이프 → 브라우저 제스처 차단
      e.preventDefault();
    }

    function hasHorizontalScroll(el: Element | null): boolean {
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 1) {
          const ox = getComputedStyle(el).overflowX;
          if (ox === "auto" || ox === "scroll") return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
