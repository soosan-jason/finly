"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, Menu, LogOut, User } from "lucide-react";
import { useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut } = useUser();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="border-t border-gray-800 bg-gray-950 px-4 py-2 md:hidden">
          <div className="mb-2">
            <SearchBar />
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === link.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-gray-800 pt-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" /> 로그아웃
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-emerald-400"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
