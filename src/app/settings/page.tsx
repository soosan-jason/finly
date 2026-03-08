"use client";

import { DateFormatToggle } from "@/components/ui/DateFormatToggle";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { useT } from "@/lib/i18n/useT";

export default function SettingsPage() {
  const t = useT();
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-white">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-gray-400">{t("settings.description")}</p>
      </div>

      <section className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t("settings.section.display")}
        </h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">

          {/* 언어 */}
          <div className="px-4 py-3.5 space-y-2">
            <div>
              <p className="text-sm font-medium text-white">{t("settings.language")}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t("settings.language.desc")}</p>
            </div>
            <LanguageSelect />
          </div>

          {/* 시간대 */}
          <div className="px-4 py-3.5 space-y-2">
            <div>
              <p className="text-sm font-medium text-white">{t("settings.timezone")}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t("settings.timezone.desc")}</p>
            </div>
            <TimezoneSelect />
          </div>

          {/* 시각 형식 */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">{t("settings.timeFormat")}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t("settings.timeFormat.desc")}</p>
            </div>
            <DateFormatToggle />
          </div>

        </div>
      </section>
    </div>
  );
}
