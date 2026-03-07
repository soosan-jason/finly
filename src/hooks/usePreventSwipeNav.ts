import { useEffect, useRef } from "react";

/**
 * 수평/수직 스크롤이 가능한 컨테이너에 붙이면,
 * 스크롤 경계에 도달했을 때 브라우저의 뒤로가기/앞으로가기
 * 네비게이션 제스처(화면 움직임 효과)를 차단한다.
 *
 * 사용법:
 *   const scrollRef = usePreventSwipeNav<HTMLDivElement>();
 *   <div ref={scrollRef} className="overflow-x-auto"> ... </div>
 */
export function usePreventSwipeNav<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    function onStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onMove(e: TouchEvent) {
      if (!el) return;
      if (e.touches.length !== 1) return;

      const dx    = e.touches[0].clientX - startX;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.touches[0].clientY - startY);

      // 노이즈 제거: 3px 미만 무시
      if (absDx < 3) return;
      // 수직 이동이 우세하면 세로 스크롤로 간주 → 통과
      if (absDy > absDx * 1.2) return;

      // 터치 대상부터 이 컨테이너까지 수평 스크롤 여지 확인
      let node = e.target as HTMLElement | null;
      while (node && node !== el.parentElement) {
        const ox = window.getComputedStyle(node).overflowX;
        const oy = window.getComputedStyle(node).overflowY;

        // 수평 스크롤 가능한 조상이 해당 방향으로 여유가 있으면 허용
        if (ox === "auto" || ox === "scroll") {
          const atLeft  = node.scrollLeft <= 0;
          const atRight = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
          if (dx < 0 && !atRight) return;
          if (dx > 0 && !atLeft)  return;
        }

        // 수직 스크롤만 가능한 요소 안에서의 수평 이동은 차단
        if ((oy === "auto" || oy === "scroll") && ox !== "auto" && ox !== "scroll") {
          break;
        }

        node = node.parentElement;
      }

      // 경계 도달 또는 스크롤 불가 → 브라우저 네비게이션 차단
      e.preventDefault();
    }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove",  onMove,  { passive: false });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
    };
  }, []);

  return ref;
}
