"use client";

import { useEffect, useState } from "react";
import { CryptoAsset } from "@/types/market";
import { CryptoTable } from "./CryptoTable";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

const FALLBACK: CryptoAsset[] = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 67234.12, price_change_percentage_24h: 2.34, market_cap: 1324000000000, total_volume: 28900000000, high_24h: 68100, low_24h: 65800, market_cap_rank: 1 },
  { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 3521.88, price_change_percentage_24h: -1.12, market_cap: 423000000000, total_volume: 14200000000, high_24h: 3600, low_24h: 3480, market_cap_rank: 2 },
  { id: "tether", symbol: "usdt", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", current_price: 1.00, price_change_percentage_24h: 0.01, market_cap: 114000000000, total_volume: 52000000000, high_24h: 1.001, low_24h: 0.999, market_cap_rank: 3 },
  { id: "binancecoin", symbol: "bnb", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", current_price: 598.34, price_change_percentage_24h: 1.45, market_cap: 88400000000, total_volume: 1900000000, high_24h: 605, low_24h: 588, market_cap_rank: 4 },
  { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", current_price: 172.54, price_change_percentage_24h: 3.21, market_cap: 79300000000, total_volume: 3800000000, high_24h: 175, low_24h: 166, market_cap_rank: 5 },
];

interface CryptoSectionProps { limit?: number; }

export function CryptoSection({ limit = 10 }: CryptoSectionProps) {
  const t = useT();
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCryptos() {
      try {
        const res = await fetch(`/api/crypto?limit=${limit}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setCryptos(data);
      } catch {
        setCryptos(FALLBACK.slice(0, limit));
      } finally {
        setLoading(false);
      }
    }
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 60_000);
    return () => clearInterval(interval);
  }, [limit]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{t("crypto.title")}</h2>
        <Link href="/crypto" className="text-sm text-emerald-400 hover:underline">
          전체보기 →
        </Link>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-800" />
            ))}
          </div>
        ) : (
          <CryptoTable cryptos={cryptos} />
        )}
      </div>
    </section>
  );
}
