"use client";

import { use, useState } from "react";
import { TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  searchParamsPromise: Promise<{ redirectTo?: string }>;
}

export function LoginClient({ searchParamsPromise }: Props) {
  const searchParams = use(searchParamsPromise);
  const redirectTo = searchParams.redirectTo ?? "/portfolio";
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-gray-800 bg-gray-900 p-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Finly에 오신 것을 환영합니다</h1>
          <p className="mt-2 text-sm text-gray-400">
            포트폴리오 관리와 관심 종목을 위해 로그인하세요
          </p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Google로 계속하기
        </button>

        <p className="text-center text-xs text-gray-500">
          로그인하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
