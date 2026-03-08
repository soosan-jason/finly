export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toLocaleString();
}

// ─── 날짜/시간 유틸 ────────────────────────────────────────────────

/** Unix 초(epoch seconds) → ISO 8601 문자열 */
export function unixToISO(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString();
}

/** ISO 문자열 → "HH:mm" (24시) */
export function formatTime(iso: string, locale = "ko-KR", timeZone?: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });
}

/** ISO 문자열 → "HH:mm:ss" (24시) */
export function formatTimeWithSec(iso: string, locale = "ko-KR", timeZone?: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });
}

/** ISO / YYYY-MM-DD 문자열 → 지역화된 월/일 */
export function formatMonthDay(iso: string, locale = "ko-KR", timeZone?: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

/** ISO 문자열 → 지역화된 월/일 HH:mm */
export function formatDateTime(iso: string, locale = "ko-KR", timeZone?: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });
}

/** Unix 초 → 로케일에 맞는 상대 시간 문자열 */
export function formatTimeAgo(unixTs: number, locale = "ko-KR"): string {
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  const suffixes: Record<string, [string, string, string, string]> = {
    "ko-KR": ["초 전",   "분 전",    "시간 전",  "일 전"],
    "en-US": ["s ago",  "m ago",   "h ago",   "d ago"],
    "ja-JP": ["秒前",    "分前",     "時間前",   "日前"],
    "zh-CN": ["秒前",    "分钟前",   "小时前",   "天前"],
  };
  const [s, m, h, d] = suffixes[locale] ?? suffixes["ko-KR"];
  if (diff < 60)    return `${diff}${s}`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}${m}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${h}`;
  return `${Math.floor(diff / 86400)}${d}`;
}
