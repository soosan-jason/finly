# Finly 인프라 환경 문서

> 최종 업데이트: 2026-03-04

---

## 1. 기술 스택 요약

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 15.3 (App Router) + TypeScript 5 |
| **런타임** | React 19 |
| **스타일링** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **차트** | Lightweight Charts 5.1 (TradingView) |
| **전역 상태** | Zustand 5 |
| **서버 상태** | TanStack Query 5 |
| **데이터베이스** | Supabase (PostgreSQL) |
| **인증** | Supabase Auth (OAuth + Email) |
| **배포** | Vercel |
| **패키지 매니저** | npm |

---

## 2. 배포 환경

### Vercel
- **플랫폼:** Vercel (Serverless, Edge)
- **배포 방식:** GitHub `main` 브랜치 push → 자동 배포 (약 1~2분 소요)
- **빌드 명령:** `npm run build` → `next build`
- **출력 디렉토리:** `.next`
- **프로덕션 URL:** https://finly2.vercel.app
- **빌드 리전:** Washington D.C., USA (East) – iad1

### vercel.json 캐시 설정

```json
{
  "/api/(.*)":   "s-maxage=60, stale-while-revalidate=30",
  "/icons/(.*)": "public, max-age=31536000, immutable",
  "/og-image.png": "public, max-age=86400"
}
```

---

## 3. 데이터베이스 (Supabase)

### 개요
- **서비스:** Supabase Cloud (Free Tier)
- **DB 엔진:** PostgreSQL
- **인증:** Supabase Auth (Row Level Security 적용)
- **제한:** 저장소 500MB, MAU 50,000

### 테이블 구조

#### `portfolios`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| user_id | UUID FK | `auth.users` 참조 |
| name | TEXT | 포트폴리오 이름 |
| description | TEXT | 설명 (nullable) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 (트리거 자동 갱신) |

#### `holdings`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| portfolio_id | UUID FK | `portfolios` 참조 |
| user_id | UUID FK | `auth.users` 참조 |
| asset_type | TEXT | `'crypto'` \| `'stock'` \| `'etf'` |
| symbol | TEXT | 종목 ID (예: `bitcoin`, `AAPL`) |
| name | TEXT | 종목명 |
| image_url | TEXT | 로고 이미지 URL (nullable) |
| quantity | NUMERIC(20,8) | 보유 수량 |
| avg_buy_price | NUMERIC(20,8) | 평균 매수가 (USD 기준) |
| currency | TEXT | 통화 (기본값 `'USD'`) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 (트리거 자동 갱신) |

#### `transactions`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| holding_id | UUID FK | `holdings` 참조 |
| user_id | UUID FK | `auth.users` 참조 |
| type | TEXT | `'buy'` \| `'sell'` |
| quantity | NUMERIC(20,8) | 거래 수량 |
| price | NUMERIC(20,8) | 거래 단가 |
| fee | NUMERIC(20,8) | 수수료 |
| note | TEXT | 메모 |
| traded_at | TIMESTAMPTZ | 거래 시각 |

> ⚠️ `transactions` 테이블은 스키마만 존재하며 UI/API 미구현 상태

#### `watchlist`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| user_id | UUID FK | `auth.users` 참조 |
| asset_type | TEXT | `'crypto'` \| `'stock'` \| `'etf'` |
| symbol | TEXT | 종목 ID |
| name | TEXT | 종목명 |
| image_url | TEXT | 로고 (nullable) |
| added_at | TIMESTAMPTZ | 추가일 |
| UNIQUE | — | `(user_id, symbol)` 중복 방지 |

### Row Level Security (RLS)
모든 테이블에 RLS 활성화. 본인(`auth.uid() = user_id`) 데이터만 CRUD 가능.

---

## 4. 외부 API 연동

| API | 용도 | 요청 제한 | 비용 |
|-----|------|-----------|------|
| **CoinGecko** | 암호화폐 가격·시가총액·차트·검색 | 30 req/min | 무료 (Demo Key) |
| **Finnhub** | 주식 시세·뉴스·종목 검색 | 60 req/min | 무료 |
| **Yahoo Finance** | 주요 지수(KOSPI·NASDAQ 등)·환율 | 비공식 (무제한) | 무료 |
| **MyMemory Translate** | 뉴스 헤드라인 한국어 번역 | ~5,000자/일 | 무료 |
| **Supabase Auth** | 회원가입·로그인·세션 관리 | MAU 50,000 | 무료 |

### API 캐시 설정 (Next.js `next: { revalidate }`)

| 엔드포인트 | revalidate |
|-----------|-----------|
| 암호화폐 가격 | 60초 |
| 주식 시세 | 60초 |
| 시장 뉴스 | 300초 |
| 환율 (Yahoo Finance) | 300초 |
| 종목 검색 | 30초 |

---

## 5. API 라우트 목록

```
src/app/api/
├── crypto/
│   ├── route.ts              GET  /api/crypto?limit=N        상위 N개 암호화폐
│   └── [id]/
│       ├── route.ts          GET  /api/crypto/:id            코인 상세
│       └── chart/route.ts    GET  /api/crypto/:id/chart      가격 차트
├── stock/
│   └── quote/route.ts        GET  /api/stock/quote?symbol=   주식 현재가 (Finnhub)
├── markets/
│   └── indices/route.ts      GET  /api/markets/indices       주요 지수
├── portfolio/
│   ├── route.ts              GET/POST  /api/portfolio         포트폴리오 목록·생성
│   ├── holdings/route.ts     GET/POST/DELETE  /api/portfolio/holdings
│   └── watchlist/route.ts    GET/POST/DELETE  /api/portfolio/watchlist
├── search/route.ts           GET  /api/search?q=&type=       종목 검색 (코인/주식)
├── fx/route.ts               GET  /api/fx?pair=              환율 조회
└── news/route.ts             GET  /api/news?category=        시장 뉴스
```

---

## 6. 프로젝트 디렉토리 구조

```
finly/
├── public/                   정적 파일 (아이콘, OG 이미지)
├── supabase/
│   └── schema.sql            DB 스키마 (Supabase SQL Editor에서 실행)
├── src/
│   ├── app/                  Next.js App Router 페이지·레이아웃
│   │   ├── api/              API Route Handlers
│   │   ├── auth/             로그인·OAuth 콜백
│   │   ├── crypto/           암호화폐 목록·상세
│   │   ├── markets/          시장 지수 페이지
│   │   ├── news/             뉴스 페이지
│   │   └── portfolio/        포트폴리오 페이지
│   ├── components/
│   │   ├── auth/             LoginClient
│   │   ├── charts/           PriceChart (TradingView)
│   │   ├── layout/           Header
│   │   ├── markets/          시장 관련 컴포넌트
│   │   ├── news/             뉴스 카드
│   │   ├── portfolio/        포트폴리오 컴포넌트
│   │   └── ui/               공통 UI (Card, Badge, SearchBar 등)
│   ├── hooks/
│   │   └── useUser.ts        Supabase 인증 훅
│   ├── lib/
│   │   ├── api/
│   │   │   ├── coingecko.ts  CoinGecko API 래퍼
│   │   │   ├── finnhub.ts    Finnhub API 래퍼
│   │   │   └── yahoo-finance.ts  Yahoo Finance 래퍼
│   │   ├── supabase/         Supabase 클라이언트 (client·server·middleware)
│   │   └── utils/
│   │       ├── cn.ts         clsx + tailwind-merge
│   │       └── format.ts     숫자·통화·퍼센트 포맷터
│   ├── middleware.ts          세션 갱신·라우트 보호
│   ├── store/                Zustand 전역 상태 (예정)
│   └── types/
│       ├── market.ts         시장 타입
│       └── portfolio.ts      포트폴리오 타입
├── .env.example              환경변수 템플릿
├── next.config.ts            Next.js 설정 (보안 헤더·이미지 도메인)
├── vercel.json               Vercel 배포 설정
├── components.json           shadcn/ui 설정
└── tsconfig.json             TypeScript 설정
```

---

## 7. 환경변수

`.env.local` 파일에 설정 (Vercel 대시보드의 Environment Variables에도 동일하게 등록 필요)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # 서버 전용 (클라이언트 노출 금지)

# Finnhub (https://finnhub.io/dashboard)
FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxx    # 서버 전용

# CoinGecko (https://www.coingecko.com/en/api)
COINGECKO_API_KEY=CG-xxxxxxxxxxxx       # 서버 전용

# Alpha Vantage (미사용, 예비)
ALPHA_VANTAGE_API_KEY=XXXXXXXXXXXXXXXX

# 앱 URL
NEXT_PUBLIC_APP_URL=https://finly2.vercel.app
```

---

## 8. 보안 설정

### HTTP 보안 헤더 (`next.config.ts`)
모든 라우트에 적용:

| 헤더 | 값 |
|------|----|
| `X-DNS-Prefetch-Control` | `on` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### 미들웨어 (`src/middleware.ts`)
- Supabase 세션 자동 갱신
- `/portfolio` 접근 시 미인증 → `/auth/login` 리다이렉트
- 정적 파일(이미지·svg 등)은 미들웨어 제외

### 이미지 허용 도메인 (`next.config.ts`)
- `assets.coingecko.com/coins/images/**`
- `coin-images.coingecko.com/coins/images/**`

---

## 9. CI/CD 파이프라인

```
코드 수정
  └─→ git push origin main
        └─→ Vercel 자동 감지
              ├─→ npm install
              ├─→ next build (TypeScript 타입 체크 + ESLint 포함)
              └─→ 성공 시 프로덕션 배포 (https://finly2.vercel.app)
```

- GitHub Actions 미사용 (Vercel 내장 CI로 처리)
- Docker 미사용
- 빌드 실패 시 이전 배포 유지 (자동 롤백)

---

## 10. 주요 의존성

```json
{
  "next": "^15.3.0",
  "react": "^19.0.0",
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.98.0",
  "@tanstack/react-query": "^5.90.21",
  "lightweight-charts": "^5.1.0",
  "zustand": "^5.0.11",
  "lucide-react": "^0.576.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```
