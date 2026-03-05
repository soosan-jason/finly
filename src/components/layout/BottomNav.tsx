"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Bitcoin, Briefcase, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/",          label: "대시보드", Icon: LayoutDashboard },
  { href: "/markets",   label: "시장",     Icon: BarChart2 },
  { href: "/crypto",    label: "암호화폐", Icon: Bitcoin },
  { href: "/portfolio", label: "포트폴리오", Icon: Briefcase },
  { href: "/news",      label: "뉴스",     Icon: Newspaper },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              pathname === href ? "text-emerald-400" : "text-gray-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
