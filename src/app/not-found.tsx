import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-black text-emerald-500">404</p>
      <h2 className="mt-4 text-xl font-semibold text-white">페이지를 찾을 수 없습니다</h2>
      <p className="mt-2 text-sm text-gray-400">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          <Home className="h-4 w-4" />
          홈으로
        </Link>
        <Link
          href="/crypto"
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Search className="h-4 w-4" />
          코인 검색
        </Link>
      </div>
    </div>
  );
}
