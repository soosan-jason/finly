"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Search } from "lucide-react";
import { HoldingFormData } from "@/types/portfolio";

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

interface Props {
  portfolioId: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddHoldingModal({ portfolioId, onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const body: HoldingFormData = {
      asset_type: "crypto",
      symbol: selected.id,
      name: selected.name,
      image_url: selected.image,
      quantity: parseFloat(quantity),
      avg_buy_price: parseFloat(price),
    };
    await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, portfolio_id: portfolioId }),
    });
    setSubmitting(false);
    onAdded();
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">종목 추가</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 코인 검색 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">코인 선택</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-gray-800 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Image src={selected.image} alt={selected.name} width={24} height={24} className="rounded-full" />
                  <span className="text-sm font-medium text-white">{selected.name}</span>
                  <span className="text-xs text-gray-500 uppercase">{selected.symbol}</span>
                </div>
                <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="text-gray-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="비트코인, 이더리움..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
                />
                {results.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-gray-700 bg-gray-900 shadow-xl overflow-hidden">
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => { setSelected(r); setResults([]); }}
                          className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors"
                        >
                          <Image src={r.image} alt={r.name} width={20} height={20} className="rounded-full" />
                          <span className="text-sm text-white">{r.name}</span>
                          <span className="ml-auto text-xs text-gray-500 uppercase">{r.symbol}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 수량 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">보유 수량</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 평균 매수가 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">평균 매수가 (USD)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!selected || !quantity || !price || submitting}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {submitting ? "추가 중..." : "포트폴리오에 추가"}
          </button>
        </form>
      </div>
    </div>
  );
}
