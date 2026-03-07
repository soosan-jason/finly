# Finly 개발 기록

## 2차 개발

### 1단계 — 시장(Markets) 페이지 재구성

> 데이터 확장 핵심

- 탭 UI 구성 (지수 / 선물 / 원자재 / 채권 / 주식)
- 선물 API + 카드
- 원자재 API + 카드
- 채권 API + 수익률 곡선 차트
- 주요국 주식 API + 카드 (미국 / 한국 / 일본)

**상태:** 완료

---

### 2단계 — 대시보드 재구성

> Markets 완성 후 요약 발췌

- 암호화폐 BTC / ETH 2개로 축소
- 선물 / 원자재 요약 추가
- 주요국 주식 탭 추가

**상태:** 완료

---

### 3단계 — 포트폴리오 고도화

> DB 설계 필요, 독립적

#### 스냅샷 테이블 설계 (Supabase)

`supabase/schema.sql`에 `portfolio_snapshots` 테이블 추가.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| portfolio_id | UUID (FK) | 포트폴리오 참조 |
| user_id | UUID (FK) | 사용자 참조 |
| snapshotted_on | DATE | 날짜 기준 (하루 1회 upsert) |
| total_value_krw | NUMERIC | 원화 자산 평가액 |
| total_cost_krw | NUMERIC | 원화 투자 원금 |
| profit_loss_krw | NUMERIC | 원화 손익 |
| total_value_usd | NUMERIC | 달러 자산 평가액 |
| total_cost_usd | NUMERIC | 달러 투자 원금 |
| profit_loss_usd | NUMERIC | 달러 손익 |

- `UNIQUE(portfolio_id, snapshotted_on)` — 날짜별 1개 보장
- RLS 적용 (본인 데이터만 접근)

> **Supabase Dashboard에서 실행 필요** — `schema.sql` 하단 스냅샷 테이블 섹션

#### 스냅샷 API

| 엔드포인트 | 역할 |
|---|---|
| `POST /api/portfolio/snapshot` | 오늘 날짜 스냅샷 upsert |
| `GET /api/portfolio/snapshot?portfolio_id=&days=30` | 기간별 스냅샷 조회 |

- 포트폴리오 페이지 방문 시 **하루 1회** 자동 저장 (`snapshotSavedRef`로 중복 방지)
- 스냅샷 실패는 조용히 무시 (UX에 영향 없음)

#### 자산 추이 차트 (`PortfolioChart.tsx`)

- `lightweight-charts` 재사용 (이미 설치됨)
- 기간 선택: 7일 / 30일 / 90일 / 전체
- KRW / USD 통화 탭 전환 (보유 자산 종류에 따라 자동 표시)
- 스냅샷이 없으면 "데이터 쌓이는 중" 안내 메시지 표시

#### UI/UX 개선

- `SummaryHeroCard` 아래에 자산 추이 차트 섹션 추가
- KRW/USD 탭은 양쪽 자산이 모두 있을 때만 표시
- 모바일 FAB, 탭 구조 유지

**상태:** 완료
