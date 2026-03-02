"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
      <h2 className="text-xl font-semibold text-white">오류가 발생했습니다</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        페이지를 불러오는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-600">오류 코드: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          홈으로
        </Link>
      </div>
    </div>
  );
}
