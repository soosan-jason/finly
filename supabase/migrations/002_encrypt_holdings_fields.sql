-- ============================================================
-- holdings 민감 필드 타입 변경 (NUMERIC → TEXT)
-- 목적: 애플리케이션 레이어 AES-256-GCM 암호화 값 저장
--
-- 주의: 기존 데이터가 있다면 아래 주석의 데이터 마이그레이션 절차를 먼저 수행
--
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

-- quantity, avg_buy_price 컬럼을 TEXT로 변경
-- 기존 숫자 값은 TEXT로 캐스팅되어 그대로 보존됨
-- (애플리케이션의 decryptField()가 평문 숫자 문자열 fallback 처리)
ALTER TABLE holdings
  ALTER COLUMN quantity      TYPE TEXT USING quantity::TEXT,
  ALTER COLUMN avg_buy_price TYPE TEXT USING avg_buy_price::TEXT;

-- transactions 테이블의 민감 필드도 동일하게 변경
ALTER TABLE transactions
  ALTER COLUMN quantity TYPE TEXT USING quantity::TEXT,
  ALTER COLUMN price    TYPE TEXT USING price::TEXT,
  ALTER COLUMN fee      TYPE TEXT USING fee::TEXT;
