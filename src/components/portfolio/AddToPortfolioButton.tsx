"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, X, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import type { AssetType } from "@/types/portfolio";

interface Props {
  assetType: AssetType;
  symbol: string;
  name: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
}

interface Portfolio {
  id: string;
  name: string;
}

export function AddToPortfolioButton({
  assetType,
  symbol,
  name,
  imageUrl,
  currentPrice,
  currency,
}: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(currentPrice != null ? String(currentPrice) : "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function openModal() {
    if (!user) { router.push("/auth/login"); return; }
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setPortfolios(data);
      setPortfolioId(data[0].id);
    }
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuantity("");
    setPrice(currentPrice != null ? String(currentPrice) : "");
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!portfolioId) return;
    setSubmitting(true);
    await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        asset_type: assetType,
        symbol,
        name,
        image_url: imageUrl,
        quantity: parseFloat(quantity),
        avg_buy_price: parseFloat(price),
        currency,
      }),
    });
    setSubmitting(false);
    setDone(true);
  }

  const ticker = name.slice(0, 1).toUpperCase();

  return (
    <>
      <button
        onClick={openModal}
        title="포트폴리오에 추가"
        className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 p-2.5 text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
      >
        <Plus className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">포트폴리오에 추가</h2>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-3xl">✓</div>
                <p className="text-white font-medium">추가 완료!</p>
                <p className="text-sm text-gray-400">{name}이(가) 포트폴리오에 추가되었습니다.</p>
                <button
                  onClick={close}
                  className="mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
                >
                  닫기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 종목 정보 (read-only) */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={name} width={28} height={28} className="rounded-full shrink-0" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 shrink-0">
                      {ticker}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-gray-500 uppercase">{symbol}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-600 shrink-0">{currency}</span>
                </div>

                {/* 포트폴리오 선택 */}
                {portfolios.length > 1 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">포트폴리오</label>
                    <div className="relative">
                      <select
                        value={portfolioId}
                        onChange={(e) => setPortfolioId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors pr-8"
                      >
                        {portfolios.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                )}

                {/* 수량 */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">보유 수량</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    autoFocus
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* 평균 매수가 */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    평균 매수가 ({currency})
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
                  disabled={!quantity || !price || submitting || !portfolioId}
                  className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {submitting ? "추가 중..." : "포트폴리오에 추가"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
