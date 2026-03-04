import { NextRequest, NextResponse } from "next/server";
import { getMarketNews, FinnhubNewsItem } from "@/lib/api/finnhub";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function translateHeadline(text: string): Promise<string> {
  if (!text) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return text;
    const data = await res.json();
    return data.responseStatus === 200 ? (data.responseData.translatedText as string) : text;
  } catch {
    return text;
  }
}

export interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;       // unix timestamp
  category: string;
  related: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") ?? "general") as "general" | "forex" | "crypto";
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey || apiKey === "your_finnhub_api_key") {
    return NextResponse.json(FALLBACK_NEWS.slice(0, limit));
  }

  try {
    const items: FinnhubNewsItem[] = await getMarketNews(category);

    let articles: NewsArticle[] = items
      .filter((i) => i.headline && i.url)
      .slice(0, limit)
      .map((i) => ({
        id: i.id,
        headline: i.headline,
        summary: stripHtml(i.summary ?? ""),
        source: i.source ?? "",
        url: i.url,
        image: i.image ?? "",
        datetime: i.datetime,
        category: i.category,
        related: i.related ?? "",
      }));

    const translatedHeadlines = await Promise.all(articles.map((a) => translateHeadline(a.headline)));
    articles = articles.map((a, i) => ({ ...a, headline: translatedHeadlines[i] ?? a.headline }));

    return NextResponse.json(articles, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json(FALLBACK_NEWS.slice(0, limit));
  }
}

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 1,
    headline: "Bitcoin surges past $70,000 as institutional demand grows",
    summary: "Bitcoin's price reached a new milestone as major institutional players continue to accumulate the cryptocurrency amid growing ETF inflows.",
    source: "Reuters",
    url: "#",
    image: "",
    datetime: Math.floor(Date.now() / 1000) - 3600,
    category: "crypto",
    related: "BTCUSD",
  },
  {
    id: 2,
    headline: "S&P 500 closes at record high on strong earnings reports",
    summary: "US equities rallied to fresh all-time highs as major corporations reported better-than-expected quarterly earnings.",
    source: "Bloomberg",
    url: "#",
    image: "",
    datetime: Math.floor(Date.now() / 1000) - 7200,
    category: "general",
    related: "SPY",
  },
  {
    id: 3,
    headline: "Fed signals potential rate cuts in second half of 2026",
    summary: "Federal Reserve officials indicated growing confidence that inflation is under control, opening the door for interest rate reductions.",
    source: "WSJ",
    url: "#",
    image: "",
    datetime: Math.floor(Date.now() / 1000) - 10800,
    category: "general",
    related: "",
  },
  {
    id: 4,
    headline: "KOSPI rises 0.5% on foreign buying and chip sector strength",
    summary: "South Korea's benchmark index gained ground as foreign investors returned to the market, with semiconductor stocks leading the advance.",
    source: "Yonhap",
    url: "#",
    image: "",
    datetime: Math.floor(Date.now() / 1000) - 14400,
    category: "general",
    related: "KOSPI",
  },
  {
    id: 5,
    headline: "Ethereum ETF sees record daily inflows",
    summary: "Spot Ethereum ETFs in the US recorded their highest single-day inflows since launch, reflecting growing institutional appetite for the second-largest cryptocurrency.",
    source: "CoinDesk",
    url: "#",
    image: "",
    datetime: Math.floor(Date.now() / 1000) - 18000,
    category: "crypto",
    related: "ETHUSD",
  },
];
