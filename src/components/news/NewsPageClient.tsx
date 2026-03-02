"use client";

import { useEffect, useState } from "react";
import { NewsArticle } from "@/app/api/news/route";
import { NewsCard } from "./NewsCard";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const CATEGORIES = [
  { value: "general", label: "전체" },
  { value: "crypto",  label: "암호화폐" },
  { value: "forex",   label: "외환" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function NewsPageClient() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("general");
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchNews(cat = category) {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${cat}&limit=30`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNews(category); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
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
          {lastUpdated && <span>{lastUpdated} 기준</span>}
          <button
            onClick={() => fetchNews()}
            className="rounded-lg p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
          <p className="text-gray-400">뉴스를 불러올 수 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
