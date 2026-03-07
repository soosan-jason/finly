import { useCallback, useRef } from "react";

interface Options {
  count: number;
  current: number;
  onChange: (index: number) => void;
  /** 탭 전환으로 인정하는 최소 수평 거리 (px). 기본 60 */
  minDist?: number;
}

/**
 * 콘텐츠 영역에서 좌우 스와이프로 탭을 전환하는 훅.
 *
 * 사용법:
 *   const { containerRef, onTouchStart, onTouchEnd } = useSwipeTab({ ... });
 *   <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
 *     ...
 *   </div>
 *
 * 수평으로 스크롤 가능한 자식 요소(테이블 등) 안에서는 해당 요소의 스크롤이
 * 끝에 도달했을 때만 탭 전환을 허용한다.
 */
export function useSwipeTab({ count, current, onChange, minDist = 60 }: Options) {
  const startX = useRef(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx    = e.changedTouches[0].clientX - startX.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.changedTouches[0].clientY - startY.current);

      // 최소 거리 미충족 or 수직 이동이 더 크면 무시
      if (absDx < minDist || absDy > absDx * 0.8) return;

      // 수평 스크롤 가능한 조상이 해당 방향으로 여유가 있으면 탭 전환 안 함
      const container = containerRef.current;
      let el = e.target as HTMLElement | null;
      while (el && el !== container) {
        const ox = window.getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") {
          const atLeft  = el.scrollLeft <= 0;
          const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
          if (dx < 0 && !atRight) return; // 왼쪽 스와이프인데 오른쪽 스크롤 여지 있음
          if (dx > 0 && !atLeft)  return; // 오른쪽 스와이프인데 왼쪽 스크롤 여지 있음
        }
        el = el.parentElement;
      }

      if (dx < 0 && current < count - 1) onChange(current + 1); // 왼쪽 스와이프 → 다음 탭
      if (dx > 0 && current > 0)         onChange(current - 1); // 오른쪽 스와이프 → 이전 탭
    },
    [count, current, onChange, minDist],
  );

  return { containerRef, onTouchStart, onTouchEnd };
}
