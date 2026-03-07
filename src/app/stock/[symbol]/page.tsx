import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils/format";
import { WatchlistToggle } from "@/components/portfolio/WatchlistToggle";

import type { Metadata } from "next";

interface StockDetail {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  change: number;
  change_percent: number;
  prev_close: number;
  high: number | null;
  low: number | null;
  open: number | null;
  volume: number | null;
  market_cap: number | null;
}

async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/stock/${encodeURIComponent(symbol)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as StockDetail;
  } catch {
    return null;
  }
}

function formatStockPrice(value: number | null, currency: string): string {
  if (value == null) return "-";
  const isKRW = currency === "KRW";
  return new Intl.NumberFormat(isKRW ? "ko-KR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: isKRW ? 0 : value < 1 ? 6 : 2,
  }).format(value);
}

function formatVolume(value: number | null): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await getStockDetail(symbol);
  if (!stock) return { title: "주식 정보" };
  return {
    title: `${stock.name} (${stock.symbol}) - ${formatStockPrice(stock.price, stock.currency)}`,
    description: `${stock.name} 실시간 주가, 등락률, 거래량 정보.`,
  };
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = await getStockDetail(symbol);
  if (!stock) notFound();

  const isUp = stock.change_percent >= 0;
  const p = (v: number | null) => formatStockPrice(v, stock.currency);

  const isKorean = stock.symbol.endsWith(".KS") || stock.symbol.endsWith(".KQ");

  const stats = [
    { label: "시가", value: p(stock.open) },
    { label: "전일종가", value: p(stock.prev_close) },
    { label: "고가", value: p(stock.high) },
    { label: "저가", value: p(stock.low) },
    { label: "거래량", value: formatVolume(stock.volume) },
    {
      label: "시가총액",
      value: stock.market_cap
        ? stock.currency === "KRW"
          ? `₩${(stock.market_cap / 1_000_000_000_000).toFixed(2)}조`
          : `$${(stock.market_cap / 1_000_000_000).toFixed(2)}B`
        : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        마켓
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
            {stock.symbol.replace(/\.(KS|KQ)$/, "").slice(0, 4)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{stock.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-400 uppercase">{stock.symbol}</span>
              {stock.exchange && (
                <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  {stock.exchange}
                </span>
              )}
              {isKorean && (
                <span className="rounded-md bg-blue-900/50 px-2 py-0.5 text-xs text-blue-400">
                  한국주식
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <p className="text-3xl font-bold text-white">{p(stock.price)}</p>
          <div className="flex items-center gap-1.5">
            {isUp ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <Badge variant={isUp ? "up" : "down"}>
              {stock.change >= 0 ? "+" : ""}
              {p(stock.change)} ({formatPercent(stock.change_percent)})
            </Badge>
          </div>
          <WatchlistToggle
            symbol={stock.symbol}
            name={stock.name}
            assetType="stock"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 font-semibold text-white">{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
