# Finly - 개발 계획서

> **참고 레퍼런스:** Investing.com / ETFCheck(etfcheck.co.kr) / StockPlus(stockplus.com)
> **개발 원칙:** 초기 비용 Zero, 핵심 기능 우선, 빠른 MVP 출시

---

## 1. 시장성 분석

### 타겟 시장
| 구분 | 내용 |
|------|------|
| 주요 타겟 | 개인 투자자 (주식·ETF·암호화폐 관심자) |
| 국내 시장 | 국내 주식 계좌 수 약 7,000만 개 이상 (2024 기준) |
| 핵심 니즈 | 흩어진 금융 정보를 **한 곳에서** 빠르게 확인 |
| 경쟁 포지션 | 국내 특화 + 글로벌 데이터 통합 + 깔끔한 UX |

### 레퍼런스 분석
| 서비스 | 강점 | 약점 |
|--------|------|------|
| **Investing.com** | 글로벌 데이터, 경제 캘린더, 풍부한 지표 | 광고 과다, UI 복잡, 느린 로딩 |
| **ETFCheck** | 국내 ETF 비교·분석 특화, 배당 추적 | ETF 외 자산군 미지원 |
| **StockPlus** | 국내 주식 스크리너, 종목 분석 | 해외 주식·ETF 데이터 부족 |

### 차별화 포인트
- 국내외 주식 + ETF + 암호화폐 **통합 대시보드**
- 불필요한 광고 없는 **깔끔한 UI/UX**
- 배당·포트폴리오 관리 **무료 제공**

---

## 2. 고객이 가장 필요로 하는 핵심 기능

### Phase 1 - MVP (우선 개발)
| 기능 | 설명 | 데이터 소스 |
|------|------|-------------|
| 📊 **시장 홈 대시보드** | 주요 지수(코스피·나스닥·S&P500·비트코인) 한눈에 | Yahoo Finance API, CoinGecko |
| 🔍 **종목 검색** | 국내외 주식·ETF·코인 검색 및 기본 정보 | Yahoo Finance, CoinGecko |
| 📈 **가격 차트** | 일·주·월·연 캔들/라인 차트 | Yahoo Finance API |
| 💰 **암호화폐 시세** | 실시간 코인 가격, 시총 순위 | CoinGecko API (무료) |
| 📰 **금융 뉴스** | 국내외 주요 금융 뉴스 피드 | RSS 피드 (무료) |

### Phase 2 - 핵심 기능 확장
| 기능 | 설명 | 데이터 소스 |
|------|------|-------------|
| 🗂️ **포트폴리오 관리** | 보유 자산 입력·손익 계산·비중 시각화 | 자체 DB (Supabase) |
| 🏦 **ETF 분석** | ETF 구성 종목, 수익률 비교, 보수율 | ETF 공시 데이터, Yahoo Finance |
| 📅 **경제 캘린더** | FOMC·CPI·GDP 등 주요 경제 이벤트 | Investing.com RSS / 무료 API |
| 💸 **배당 추적기** | 배당 일정, 배당수익률, 배당 이력 | Yahoo Finance API |
| 🔔 **가격 알림** | 목표가 도달 시 알림 (이메일/푸시) | 자체 구현 |

### Phase 3 - 고도화
| 기능 | 설명 |
|------|------|
| 🤖 **AI 종목 분석** | Claude AI 기반 간단한 종목 리포트 |
| 📱 **모바일 최적화** | PWA 변환으로 앱처럼 사용 |
| 👥 **커뮤니티** | 종목 토론 게시판 |

---

## 3. 무비용 개발 방법

### 무료 API 목록
| API | 용도 | 무료 한도 | URL |
|-----|------|-----------|-----|
| **CoinGecko API** | 암호화폐 시세·정보 | 30 calls/min | coingecko.com/api |
| **Yahoo Finance** (비공식) | 주식·ETF 가격·차트 | 제한 없음(비공식) | via yfinance 라이브러리 |
| **Alpha Vantage** | 주식 시세·기술지표 | 25 calls/day | alphavantage.co |
| **DART API** | 국내 기업 공시 데이터 | 10,000 calls/day | opendart.fss.or.kr |
| **KRX 정보데이터시스템** | 국내 주식·ETF 기준가 | 무료 | data.krx.co.kr |
| **Exchangerate API** | 환율 정보 | 1,500 calls/month | exchangerate-api.com |

### 무료 인프라 스택
| 구분 | 도구 | 무료 한도 |
|------|------|-----------|
| **프론트엔드 호스팅** | Vercel | 무제한 (개인) |
| **백엔드 API** | Vercel API Routes (Next.js) | 무제한 (개인) |
| **데이터베이스** | Supabase (PostgreSQL) | 500MB, 2개 프로젝트 |
| **인증** | Supabase Auth | 50,000 MAU |
| **차트 라이브러리** | Lightweight Charts (TradingView) | 완전 무료 오픈소스 |
| **UI 컴포넌트** | shadcn/ui + Tailwind CSS | 완전 무료 |
| **도메인** | GitHub Pages or Vercel 기본 도메인 | 무료 |

---

## 4. 기술 스택

```
Frontend:   Next.js 14 (App Router) + TypeScript
Styling:    Tailwind CSS + shadcn/ui
Charts:     Lightweight Charts (TradingView 오픈소스)
State:      Zustand (전역 상태) + TanStack Query (서버 상태)
Backend:    Next.js API Routes (서버리스)
Database:   Supabase (PostgreSQL + Auth + Realtime)
배포:       Vercel (프론트+백엔드 통합)
버전관리:   GitHub
```

---

## 5. 개발 스케줄

### Sprint 1 (1~2주차) - 프로젝트 셋업 & 홈 대시보드
- [ ] Next.js 프로젝트 초기 세팅 (TypeScript, Tailwind, shadcn/ui)
- [ ] Supabase 연동 (DB + Auth)
- [ ] 홈 대시보드 UI 개발 (주요 지수 카드)
- [ ] CoinGecko API 연동 (암호화폐 시세)
- [ ] Yahoo Finance API 연동 (주식 지수)

### Sprint 2 (3~4주차) - 종목 검색 & 차트
- [ ] 종목 검색 기능 (주식·ETF·코인 통합 검색)
- [ ] 종목 상세 페이지 (기본 정보, 가격 차트)
- [ ] Lightweight Charts 캔들/라인 차트 구현
- [ ] 반응형 레이아웃 완성

### Sprint 3 (5~6주차) - 포트폴리오 & ETF
- [ ] 회원가입/로그인 (Supabase Auth)
- [ ] 포트폴리오 CRUD (자산 추가·수정·삭제)
- [ ] 손익 계산 및 비중 파이차트
- [ ] ETF 분석 페이지 (구성 종목, 보수율 비교)

### Sprint 4 (7~8주차) - 뉴스·캘린더·배당
- [ ] 금융 뉴스 피드 (RSS 파싱)
- [ ] 경제 캘린더
- [ ] 배당 추적기 (배당 일정, 수익률)
- [ ] 가격 알림 (이메일 알림 - Resend 무료 플랜)

### Sprint 5 (9~10주차) - 최적화 & 런칭
- [ ] SEO 최적화
- [ ] PWA 설정 (모바일 앱처럼 사용)
- [ ] 성능 최적화 (이미지, 코드 스플리팅)
- [ ] 베타 런칭

---

## 6. 프로젝트 구조

```
finly/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/          # 홈 대시보드
│   ├── markets/            # 시장 현황
│   │   ├── stocks/         # 주식
│   │   ├── etf/            # ETF
│   │   └── crypto/         # 암호화폐
│   ├── portfolio/          # 포트폴리오 관리
│   ├── news/               # 금융 뉴스
│   ├── calendar/           # 경제 캘린더
│   └── api/                # API Routes
│       ├── markets/
│       ├── crypto/
│       └── portfolio/
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── charts/             # 차트 컴포넌트
│   ├── markets/            # 시장 관련 컴포넌트
│   └── portfolio/          # 포트폴리오 컴포넌트
├── lib/
│   ├── supabase/           # Supabase 클라이언트
│   ├── api/                # 외부 API 호출 함수
│   └── utils/              # 유틸리티 함수
└── types/                  # TypeScript 타입 정의
```

---

## 7. 예상 비용 (월 기준)

| 항목 | 비용 |
|------|------|
| Vercel (개인) | $0 |
| Supabase (Free Tier) | $0 |
| CoinGecko API (Free) | $0 |
| 도메인 (.com) | $10~15/년 (선택사항) |
| **합계** | **$0 ~ $15/년** |

> 사용자가 늘어나 Supabase 용량 초과 시 Pro 플랜 ($25/월) 고려

---

*작성일: 2026-03-02*
*프로젝트: Finly - 통합 금융 정보 플랫폼*
