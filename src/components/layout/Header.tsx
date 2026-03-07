"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, LogOut, User, Search, X, Settings } from "lucide-react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, signOut } = useUser();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const SWIPE_THRESHOLD = 100;
    const hrefs = NAV_LINKS.map((l) => l.href);

    function getMain() {
      return document.querySelector<HTMLElement>("main");
    }

    function setTransform(x: number, animated: boolean) {
      const el = getMain();
      if (!el) return;
      el.style.transition = animated ? "transform 0.25s ease" : "none";
      el.style.transform = x === 0 ? "" : `translateX(${x}px)`;
    }

    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      setTransform(0, false);
    }

    function onTouchMove(e: TouchEvent) {
      if (touchStartX.current === null) return;
      const delta = e.touches[0].clientX - touchStartX.current;
      setTransform(delta * 0.4, false);
    }

    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(delta) < SWIPE_THRESHOLD) {
        setTransform(0, true);
        return;
      }

      const currentPath = window.location.pathname;
      const idx = hrefs.indexOf(currentPath);
      if (idx === -1) {
        setTransform(0, true);
        return;
      }

      // 슬라이드 아웃 후 페이지 이동
      const exitX = delta < 0 ? -window.innerWidth : window.innerWidth;
      setTransform(exitX, true);
      setTimeout(() => {
        const el = getMain();
        if (el) { el.style.transition = "none"; el.style.transform = ""; }
        if (delta < 0) {
          router.push(hrefs[(idx + 1) % hrefs.length]);
        } else {
          router.push(hrefs[(idx - 1 + hrefs.length) % hrefs.length]);
        }
      }, 250);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
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
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Mobile search overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-10 flex items-center gap-2 bg-gray-950 px-4 md:hidden">
            <SearchBar className="flex-1" autoFocus />
            <button
              onClick={() => setSearchOpen(false)}
              className="shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
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

        {/* Search - desktop only */}
        <div className="ml-auto hidden md:flex flex-1 max-w-xs">
          <SearchBar />
        </div>

        {/* Mobile search icon */}
        <button
          className="md:hidden ml-auto p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setSearchOpen(true)}
          aria-label="검색"
        >
          <Search className="h-5 w-5" />
        </button>

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
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    설정
                  </Link>
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
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    설정
                  </Link>
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

    </header>
  );
}
