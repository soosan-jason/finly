"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchResult {
  type: "crypto" | "stock" | "etf";
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  market_cap_rank: number | null;
}

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    if (result.type === "crypto") {
      router.push(`/crypto/${result.id}`);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="코인, 주식 검색..."
          className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2 pl-9 pr-8 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-2 text-gray-500 hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">검색 결과 없음</div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-800 transition-colors"
                  >
                    {r.image ? (
                      <Image src={r.image} alt={r.name} width={24} height={24} className="rounded-full" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-gray-400 font-bold flex-shrink-0">
                        {r.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{r.symbol}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      r.type === "crypto" ? "bg-emerald-900/60 text-emerald-400" : "bg-blue-900/60 text-blue-400"
                    }`}>
                      {r.type === "crypto" ? "코인" : r.type === "etf" ? "ETF" : "주식"}
                    </span>
                    {r.market_cap_rank && (
                      <span className="text-xs text-gray-500">#{r.market_cap_rank}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
