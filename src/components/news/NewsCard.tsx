import { NewsArticle } from "@/app/api/news/route";
import { ExternalLink, Clock } from "lucide-react";

interface Props {
  article: NewsArticle;
}

function formatTimeAgo(unixTs: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  if (diff < 60)   return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "시장",
  crypto: "암호화폐",
  forex: "외환",
  merger: "M&A",
};

export function NewsCard({ article }: Props) {
  const isExternal = article.url !== "#";

  return (
    <a
      href={article.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors"
    >
      {/* Image */}
      {article.image && (
        <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Category badge */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {CATEGORY_LABELS[article.category] ?? article.category}
        </span>
        {article.related && (
          <span className="text-xs text-gray-600">{article.related}</span>
        )}
      </div>

      {/* Headline */}
      <h3 className="flex-1 text-sm font-semibold leading-snug text-white line-clamp-3 group-hover:text-emerald-400 transition-colors">
        {article.headline}
      </h3>

      {/* Summary - 영어 원문이므로 번역된 경우 숨김 */}
      {article.summary && !article.translated && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTimeAgo(article.datetime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{article.source}</span>
          {isExternal && <ExternalLink className="h-3 w-3" />}
        </div>
      </div>
    </a>
  );
}
