# Finly 프로젝트 지침

## 배포 및 확인

- 변경사항은 항상 **https://finly2.vercel.app** 에서 확인한다.
- GitHub `main` 브랜치에 푸시하면 Vercel이 자동으로 배포한다.
- 배포 완료까지 약 1~2분 소요된다.

## UI 지침

### 탭 최종 선택 유지 (localStorage)
모든 탭 UI는 사용자의 마지막 선택을 `localStorage`에 저장하고, 페이지 재방문 시 복원해야 한다.

| 페이지 | localStorage 키 | 기본값 |
|--------|----------------|--------|
| 포트폴리오 탭 (보유/관심) | `portfolio_active_tab` | `"holdings"` |
| 포트폴리오 차트 통화 | `portfolio_chart_view` | `"KRW"` |
| 뉴스 카테고리 탭 | `news-category` | `"general"` |

- 새로운 탭 UI를 추가할 때도 동일하게 적용할 것.
