import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 클라이언트 — RLS를 우회하므로 서버 전용 관리 작업에만 사용.
 * 절대 브라우저/클라이언트 컴포넌트에 노출하지 말 것.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
