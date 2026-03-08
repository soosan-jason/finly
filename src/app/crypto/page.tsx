"use client";

import { CryptoPageClient } from "@/components/markets/CryptoPageClient";
import { useT } from "@/lib/i18n/useT";

export default function CryptoPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{t("crypto.title")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("crypto.description")}</p>
      </div>
      <CryptoPageClient />
    </div>
  );
}
