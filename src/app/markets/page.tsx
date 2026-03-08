"use client";

import { MarketsPageClient } from "@/components/markets/MarketsPageClient";
import { useT } from "@/lib/i18n/useT";

export default function MarketsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{t("markets.title")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("markets.description")}</p>
      </div>
      <MarketsPageClient />
    </div>
  );
}
