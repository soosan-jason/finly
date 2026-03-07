"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Search } from "lucide-react";
import { HoldingFormData, AssetType } from "@/types/portfolio";
import { useT } from "@/lib/i18n/useT";

interface SearchResult {
  type: AssetType;
  id: string;
  symbol: string;
  name: string;
  image: string | null;
}

interface Props {
  portfolioId: string;
  onClose: () => void;
  onAdded: () => void;
}

const STORAGE_KEY = "addHoldingForm";

interface SavedForm {
  assetTab: "stock" | "crypto";
  query: string;
  selected: SearchResult | null;
  quantity: string;
  price: string;
}

function loadSaved(): SavedForm | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedForm) : null;
  } catch {
    return null;
  }
}

export function AddHoldingModal({ portfolioId, onClose, onAdded }: Props) {
  const t = useT();
  const saved = loadSaved();
  const [assetTab, setAssetTab] = useState<"stock" | "crypto">(saved?.assetTab ?? "stock");
  const [query, setQuery] = useState(saved?.query ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(saved?.selected ?? null);
  const [quantity, setQuantity] = useState(saved?.quantity ?? "");
  const [price, setPrice] = useState(saved?.price ?? "");
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // sessionStorage에 폼 상태 저장
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ assetTab, query, selected, quantity, price })
      );
    } catch { /* ignore */ }
  }, [assetTab, query, selected, quantity, price]);

  useEffect(() => {
    setSelected(null);
    setQuery("");
    setResults([]);
  }, [assetTab]);

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${assetTab}`);
      const data = await res.json();
      setResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected, assetTab]);

  // 선택된 종목의 통화 감지
  const holdingCurrency =
    !selected || selected.type === "crypto"
      ? "USD"
      : selected.id.endsWith(".KS") || selected.id.endsWith(".KQ")
      ? "KRW"
      : "USD";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const body: HoldingFormData = {
      asset_type: selected.type,
      symbol: selected.id,
      name: selected.name,
      image_url: selected.image ?? undefined,
      quantity: parseFloat(quantity),
      avg_buy_price: parseFloat(price),
      currency: holdingCurrency,
    };
    await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, portfolio_id: portfolioId }),
    });
    setSubmitting(false);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
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
          <h2 className="text-lg font-semibold text-white">{t("modal.addHolding")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 자산 유형 탭 — 주식/ETF가 왼쪽 */}
        <div className="flex gap-1 rounded-xl bg-gray-800 p-1 mb-4">
          {(["stock", "crypto"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setAssetTab(tab)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                assetTab === tab
                  ? "bg-emerald-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "crypto" ? t("modal.tab.coins") : t("modal.tab.stocks")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 종목 검색 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              {assetTab === "crypto" ? t("modal.selectCoin") : t("modal.selectStock")}
            </label>
            {selected ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-gray-800 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {selected.image ? (
                    <Image src={selected.image} alt={selected.name} width={24} height={24} className="rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      {selected.symbol.charAt(0)}
                    </div>
                  )}
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
                  placeholder={assetTab === "crypto" ? t("modal.coinPlaceholder") : t("modal.stockPlaceholder")}
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
                          {r.image ? (
                            <Image src={r.image} alt={r.name} width={20} height={20} className="rounded-full" />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                              {r.symbol.charAt(0)}
                            </div>
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
                          <span className="ml-2 shrink-0 text-xs text-gray-500 uppercase">{r.symbol}</span>
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
            <label className="mb-1.5 block text-xs font-medium text-gray-400">{t("modal.quantity")}</label>
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
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              {t("modal.avgBuyPrice")} ({holdingCurrency})
            </label>
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
            {submitting ? t("modal.adding") : t("modal.addToPortfolio")}
          </button>
        </form>
      </div>
    </div>
  );
}
