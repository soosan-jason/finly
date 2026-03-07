"use client";

import { NewsPageClient } from "@/components/news/NewsPageClient";
import { useT } from "@/lib/i18n/useT";

export default function NewsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("news.title")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("news.description")}</p>
      </div>
      <NewsPageClient />
    </div>
  );
}
