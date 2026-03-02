import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PriceChart } from "@/components/charts/PriceChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistToggle } from "@/components/portfolio/WatchlistToggle";
import { formatPrice, formatMarketCap, formatPercent } from "@/lib/utils/format";

import type { Metadata } from "next";

async function getCoinDetail(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/crypto/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const coin = await getCoinDetail(id);
  if (!coin) return { title: "코인 정보" };
  const price = coin.market_data?.current_price?.usd ?? 0;
  return {
    title: `${coin.name} (${coin.symbol?.toUpperCase()}) - $${price.toLocaleString()}`,
    description: `${coin.name} 실시간 가격, 시가총액, 차트 및 상세 정보. 현재가 $${price.toLocaleString()} USD.`,
    openGraph: {
      title: `${coin.name} (${coin.symbol?.toUpperCase()})`,
      description: `현재가 $${price.toLocaleString()} · ${coin.market_data?.price_change_percentage_24h?.toFixed(2)}% (24h)`,
      images: coin.image?.large ? [{ url: coin.image.large }] : [],
    },
  };
}

export default async function CryptoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = await getCoinDetail(id);
  if (!coin || coin.error) notFound();

  const md = coin.market_data;
  const price = md.current_price.usd;
  const change24h = md.price_change_percentage_24h;
  const change7d = md.price_change_percentage_7d;
  const change30d = md.price_change_percentage_30d;
  const isUp = change24h >= 0;

  const stats = [
    { label: "시가총액", value: formatMarketCap(md.market_cap.usd) },
    { label: "24h 거래량", value: formatMarketCap(md.total_volume.usd) },
    { label: "유통 공급량", value: md.circulating_supply ? `${(md.circulating_supply / 1e6).toFixed(2)}M` : "-" },
    { label: "최대 공급량", value: md.max_supply ? `${(md.max_supply / 1e6).toFixed(2)}M` : "∞" },
    { label: "역대 최고가", value: formatPrice(md.ath.usd) },
    { label: "역대 최저가", value: formatPrice(md.atl.usd) },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/crypto" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        암호화폐
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex items-center gap-3">
          <Image src={coin.image.large} alt={coin.name} width={48} height={48} className="rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{coin.name}</h1>
              <span className="text-sm text-gray-400 uppercase">{coin.symbol}</span>
              {md.market_cap_rank && (
                <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  #{md.market_cap_rank}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <WatchlistToggle
              symbol={coin.id}
              name={coin.name}
              imageUrl={coin.image.large}
            />
          </div>
          <p className="text-3xl font-bold text-white">{formatPrice(price)}</p>
          <div className="flex items-center gap-2">
            <Badge variant={isUp ? "up" : "down"}>{formatPercent(change24h)} 24h</Badge>
            <Badge variant={change7d >= 0 ? "up" : "down"}>{formatPercent(change7d)} 7d</Badge>
            <Badge variant={change30d >= 0 ? "up" : "down"}>{formatPercent(change30d)} 30d</Badge>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>가격 차트 (USD)</CardTitle>
        </CardHeader>
        <PriceChart coinId={id} />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 font-semibold text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Description */}
      {coin.description?.ko && (
        <Card>
          <CardHeader>
            <CardTitle>소개</CardTitle>
          </CardHeader>
          <p
            className="text-sm leading-relaxed text-gray-300 line-clamp-5"
            dangerouslySetInnerHTML={{
              __html: coin.description.ko.replace(/<a[^>]*>(.*?)<\/a>/g, "$1"),
            }}
          />
        </Card>
      )}
    </div>
  );
}

