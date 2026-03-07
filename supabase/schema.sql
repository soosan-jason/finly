-- ============================================================
-- Finly DB Schema
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS portfolios (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL DEFAULT '내 포트폴리오',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 보유 종목 테이블
CREATE TABLE IF NOT EXISTS holdings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id   UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type     TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'etf')),
  symbol         TEXT NOT NULL,   -- e.g. 'bitcoin', 'AAPL'
  name           TEXT NOT NULL,
  image_url      TEXT,
  quantity       NUMERIC(20, 8) NOT NULL DEFAULT 0,
  avg_buy_price  NUMERIC(20, 8) NOT NULL DEFAULT 0,  -- USD 기준
  currency       TEXT NOT NULL DEFAULT 'USD',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holding_id   UUID REFERENCES holdings(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity     NUMERIC(20, 8) NOT NULL,
  price        NUMERIC(20, 8) NOT NULL,
  fee          NUMERIC(20, 8) DEFAULT 0,
  note         TEXT,
  traded_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 관심 목록 테이블
CREATE TABLE IF NOT EXISTS watchlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'etf')),
  symbol     TEXT NOT NULL,  -- e.g. 'bitcoin', '^GSPC'
  name       TEXT NOT NULL,
  image_url  TEXT,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ============================================================
-- Row Level Security (RLS) - 본인 데이터만 접근 가능
-- ============================================================

ALTER TABLE portfolios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist    ENABLE ROW LEVEL SECURITY;

-- portfolios RLS
CREATE POLICY "Users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- holdings RLS
CREATE POLICY "Users can manage own holdings"
  ON holdings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions RLS
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- watchlist RLS
CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. 포트폴리오 스냅샷 테이블 (자산 추이 차트용)
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id      UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshotted_on    DATE NOT NULL,               -- 날짜 기준 (하루 1회 upsert)
  total_value_krw   NUMERIC(24, 4) NOT NULL DEFAULT 0,
  total_cost_krw    NUMERIC(24, 4) NOT NULL DEFAULT 0,
  profit_loss_krw   NUMERIC(24, 4) NOT NULL DEFAULT 0,
  total_value_usd   NUMERIC(24, 4) NOT NULL DEFAULT 0,
  total_cost_usd    NUMERIC(24, 4) NOT NULL DEFAULT 0,
  profit_loss_usd   NUMERIC(24, 4) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, snapshotted_on)
);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own snapshots"
  ON portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. 검색 인덱스 테이블 (한국어 포함 전체 종목 검색용)
-- ============================================================

CREATE TABLE IF NOT EXISTS search_index (
  id          TEXT PRIMARY KEY,          -- CoinGecko ID 또는 주식 심볼
  type        TEXT NOT NULL,             -- 'crypto' | 'stock' | 'etf' | 'commodity' | 'futures'
  symbol      TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  name_ko     TEXT,                      -- 한국어 이름 (없으면 NULL)
  image_url   TEXT,
  rank        INTEGER,                   -- 시가총액 순위 (코인 기준)
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS search_index_name_ko_idx ON search_index (name_ko);
CREATE INDEX IF NOT EXISTS search_index_name_en_idx ON search_index (name_en);
CREATE INDEX IF NOT EXISTS search_index_symbol_idx  ON search_index (symbol);
CREATE INDEX IF NOT EXISTS search_index_rank_idx    ON search_index (rank);

-- RLS: 읽기는 누구나 가능, 쓰기는 service role만 (RLS 비활성화 시 service role이 bypass)
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_index_public_read"
  ON search_index FOR SELECT
  USING (true);
