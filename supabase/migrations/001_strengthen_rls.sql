-- ============================================================
-- RLS 정책 강화 마이그레이션
-- 목적: holding_id / portfolio_id의 소유권 교차 검증 추가
--       → 타인의 ID를 주입해도 데이터에 접근 불가
--
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

-- ── holdings: portfolio_id 소유권 검증 추가 ──────────────────
DROP POLICY IF EXISTS "Users can manage own holdings" ON holdings;

CREATE POLICY "Users can manage own holdings"
  ON holdings FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.user_id = auth.uid()
    )
  );

-- ── transactions: holding_id 소유권 검증 추가 ─────────────────
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM holdings h
      WHERE h.id = holding_id
        AND h.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM holdings h
      WHERE h.id = holding_id
        AND h.user_id = auth.uid()
    )
  );

-- ── portfolio_snapshots: portfolio_id 소유권 검증 추가 ─────────
DROP POLICY IF EXISTS "Users can manage own snapshots" ON portfolio_snapshots;

CREATE POLICY "Users can manage own snapshots"
  ON portfolio_snapshots FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_id
        AND p.user_id = auth.uid()
    )
  );
