# Finly — 통합 금융 정보 플랫폼

> 주식·ETF·암호화폐를 한 곳에서. 실시간 글로벌 시장 데이터, 포트폴리오 관리, 금융 뉴스.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 📊 **시장 대시보드** | KOSPI·KOSDAQ·나스닥·S&P500·니케이 실시간 지수 |
| 💰 **암호화폐** | 코인 시세·차트·시가총액 순위 (CoinGecko) |
| 💼 **포트폴리오** | 보유 자산 등록·손익 계산·비중 차트 |
| 📰 **금융 뉴스** | 글로벌 시장·암호화폐·외환 뉴스 (Finnhub) |
| 💱 **환율** | USD/KRW·JPY·EUR·CNY 실시간 환율 (Alpha Vantage) |
| 🔍 **종목 검색** | 코인 통합 검색 |

## 기술 스택

- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **스타일**: Tailwind CSS
- **차트**: Lightweight Charts (TradingView)
- **DB/인증**: Supabase (PostgreSQL + Auth)
- **배포**: Vercel
- **API**: Finnhub · Alpha Vantage · CoinGecko

## 로컬 개발 시작

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/finly.git
cd finly

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 아래 키 입력:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   FINNHUB_API_KEY
#   ALPHA_VANTAGE_API_KEY
#   COINGECKO_API_KEY

# 4. 개발 서버 실행
npm run dev
```

> API 키 없이도 샘플(fallback) 데이터로 동작합니다.

## 환경변수

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | supabase.com |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | supabase.com |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 | supabase.com |
| `FINNHUB_API_KEY` | 시장 지수·뉴스 | finnhub.io (무료) |
| `ALPHA_VANTAGE_API_KEY` | 환율 데이터 | alphavantage.co (무료) |
| `COINGECKO_API_KEY` | 암호화폐 시세 | coingecko.com (Demo) |
| `NEXT_PUBLIC_APP_URL` | 앱 도메인 (OG/SEO 용) | — |

## Vercel 배포

1. [Vercel](https://vercel.com) 로그인 후 GitHub 저장소 연결
2. **Environment Variables** 탭에서 위 환경변수 전부 입력
3. **Region**: Seoul (icn1) 선택 (이미 vercel.json 설정됨)
4. Deploy 클릭

```bash
# Vercel CLI로 배포 시
npm i -g vercel
vercel --prod
```

## API 무료 한도

| API | 한도 | 비고 |
|-----|------|------|
| Finnhub | 60 req/min | 지수·뉴스 |
| Alpha Vantage | 25 req/day | 환율 (5분 캐시로 절약) |
| CoinGecko Demo | 30 req/min | 암호화폐 |
| Supabase | 500MB DB, 50K MAU | 무료 |

## 라우트 구조

```
/                   홈 대시보드
/markets            글로벌 시장 지수
/crypto             암호화폐 시세 목록
/crypto/[id]        코인 상세 (차트 포함)
/portfolio          포트폴리오 관리
/news               금융 뉴스
/auth/login         로그인
```

## 라이선스

MIT
