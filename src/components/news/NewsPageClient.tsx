"use client";

import { useEffect, useState } from "react";
import { NewsArticle } from "@/app/api/news/route";
import { NewsCard } from "./NewsCard";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSwipeTab } from "@/hooks/useSwipeTab";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";

const CATEGORY_VALUES = ["general", "crypto", "forex"] as const;
type Category = (typeof CATEGORY_VALUES)[number];

const STORAGE_KEY = "news-category";

export function NewsPageClient() {
  const { locale, timezone } = useDateFormat();
  const t = useT();
  const CATEGORIES = [
    { value: "general" as Category, label: t("news.cat.all") },
    { value: "crypto"  as Category, label: t("news.cat.crypto") },
    { value: "forex"   as Category, label: t("news.cat.forex") },
  ];
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>(() => {
    if (typeof window === "undefined") return "general";
    const saved = localStorage.getItem(STORAGE_KEY) as Category | null;
    return CATEGORY_VALUES.some((v) => v === saved) ? saved! : "general";
  });
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchNews(cat = category) {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${cat}&limit=30&locale=${locale}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString(locale, { timeZone: timezone }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNews(category); }, [category, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeCategory(cat: Category) {
    setCategory(cat);
    localStorage.setItem(STORAGE_KEY, cat);
  }

  const tabIndex = CATEGORIES.findIndex((c) => c.value === category);
  const { containerRef, onTouchStart, onTouchEnd } = useSwipeTab({
    count: CATEGORIES.length,
    current: tabIndex,
    onChange: (i) => changeCategory(CATEGORIES[i].value),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => changeCategory(c.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                category === c.value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {lastUpdated && <span>{lastUpdated} {t("news.basedOn")}</span>}
          <button
            onClick={() => fetchNews()}
            className="rounded-lg p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* News Grid — 좌우 스와이프로 카테고리 전환 */}
      <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
          <p className="text-gray-400">{t("news.error")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
