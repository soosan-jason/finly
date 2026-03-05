"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, LogOut, User } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { useUser } from "@/hooks/useUser";

const NAV_LINKS = [
  { href: "/",          label: "대시보드" },
  { href: "/markets",   label: "시장" },
  { href: "/crypto",    label: "암호화폐" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/news",      label: "뉴스" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut } = useUser();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const SWIPE_THRESHOLD = 60;
    const hrefs = NAV_LINKS.map((l) => l.href);

    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
    }

    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;

      const currentPath = window.location.pathname;
      const idx = hrefs.indexOf(currentPath);
      if (idx === -1) return;

      if (delta < 0) {
        // 왼쪽 스와이프 → 다음 페이지
        const next = hrefs[(idx + 1) % hrefs.length];
        router.push(next);
      } else {
        // 오른쪽 스와이프 → 이전 페이지
        const prev = hrefs[(idx - 1 + hrefs.length) % hrefs.length];
        router.push(prev);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    setUserMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-white">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span className="text-lg">finly</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
                pathname === link.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="ml-auto flex-1 max-w-xs">
          <SearchBar />
        </div>

        {/* Auth Area */}
        {!loading && (
          user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.user_metadata.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="max-w-[80px] truncate">
                  {user.user_metadata?.name ?? user.email?.split("@")[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden z-50">
                  <div className="border-b border-gray-800 px-4 py-2.5">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-400 transition-colors md:block"
            >
              로그인
            </Link>
          )
        )}

        {/* Mobile user menu button */}
        {!loading && (
          user ? (
            <div ref={userMenuRef} className="relative md:hidden">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center rounded-lg p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.user_metadata.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden z-50">
                  <div className="border-b border-gray-800 px-4 py-2.5">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="md:hidden rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 transition-colors"
            >
              로그인
            </Link>
          )
        )}
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden border-t border-gray-800 bg-gray-950">
        <div className="flex overflow-x-auto scrollbar-none">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                pathname === link.href
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
