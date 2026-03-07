"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Bitcoin, Briefcase, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/useT";

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const NAV = [
    { href: "/",          label: t("nav.dashboard"), Icon: LayoutDashboard },
    { href: "/markets",   label: t("nav.markets"),   Icon: BarChart2 },
    { href: "/crypto",    label: t("nav.crypto"),    Icon: Bitcoin },
    { href: "/portfolio", label: t("nav.portfolio"), Icon: Briefcase },
    { href: "/news",      label: t("nav.news"),      Icon: Newspaper },
  ];

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
