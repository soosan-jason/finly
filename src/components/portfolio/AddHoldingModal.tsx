"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Search, Upload, CheckCircle2, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { HoldingFormData, AssetType } from "@/types/portfolio";
import { useT } from "@/lib/i18n/useT";

interface SearchResult {
  type: AssetType;
  id: string;
  symbol: string;
  name: string;
  image: string | null;
}

interface Props {
  portfolioId: string;
  onClose: () => void;
  onAdded: () => void;
}

// ── CSV 파싱 ──────────────────────────────────────────────────────────
interface CsvRow {
  raw: string;
  symbol: string;
  quantity: number;
  price: number;
  assetType: AssetType;
  currency: string;
  // 검증 결과
  validating?: boolean;
  name?: string;       // 검증 성공 시 채워짐
  imageUrl?: string;
  resolvedSymbol?: string; // API에서 확인된 ID
  error?: string;      // "format" | "number" | "invalid"
  saved?: boolean;
}

const CRYPTO_HINTS = new Set([
  "bitcoin","btc","ethereum","eth","solana","sol","ripple","xrp","cardano","ada",
  "dogecoin","doge","polkadot","dot","avalanche","avax","chainlink","link","litecoin","ltc",
  "uniswap","uni","stellar","xlm","cosmos","atom","near","matic","polygon","tron","trx",
  "shiba","shib","binancecoin","bnb","tether","usdt","usdc","dai",
]);

function detectAssetType(sym: string): AssetType {
  const lower = sym.toLowerCase();
  if (CRYPTO_HINTS.has(lower)) return "crypto";
  if (sym.endsWith(".KS") || sym.endsWith(".KQ") || sym.endsWith(".T")) return "stock";
  return "stock";
}

function detectCurrency(sym: string, type: AssetType): string {
  if (type === "crypto") return "USD";
  if (sym.endsWith(".KS") || sym.endsWith(".KQ")) return "KRW";
  if (sym.endsWith(".T")) return "JPY";
  return "USD";
}

function parseCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 3) {
      rows.push({ raw: line, symbol: line, quantity: 0, price: 0, assetType: "stock", currency: "USD", error: "format" });
      continue;
    }
    const [symRaw, qtyRaw, priceRaw, typeHint] = parts;
    const symbol = symRaw.toUpperCase().replace(/^"|"$/g, "");

    // skip header row
    if (isNaN(Number(qtyRaw))) continue;

    const quantity = parseFloat(qtyRaw);
    const price = parseFloat(priceRaw);
    if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price < 0) {
      rows.push({ raw: line, symbol, quantity: 0, price: 0, assetType: "stock", currency: "USD", error: "number" });
      continue;
    }

    let assetType: AssetType =
      typeHint === "crypto" ? "crypto"
      : typeHint === "stock" || typeHint === "etf" ? (typeHint as AssetType)
      : detectAssetType(symRaw);

    const currency = detectCurrency(symRaw, assetType);
    rows.push({ raw: line, symbol, quantity, price, assetType, currency });
  }
  return rows;
}

const STORAGE_KEY = "addHoldingForm";

// ── 단일 추가 모드 ────────────────────────────────────────────────────
function SingleMode({ portfolioId, onAdded }: { portfolioId: string; onAdded: () => void }) {
  const t = useT();

  function loadSaved() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  const saved = loadSaved();
  const [assetTab, setAssetTab] = useState<"stock" | "crypto">(saved?.assetTab ?? "stock");
  const [query, setQuery] = useState(saved?.query ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(saved?.selected ?? null);
  const [quantity, setQuantity] = useState(saved?.quantity ?? "");
  const [price, setPrice] = useState(saved?.price ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ assetTab, query, selected, quantity, price }));
    } catch { /* ignore */ }
  }, [assetTab, query, selected, quantity, price]);

  useEffect(() => {
    setSelected(null); setQuery(""); setResults([]);
  }, [assetTab]);

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${assetTab}`);
      setResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selected, assetTab]);

  // 종목 선택 시 수량 자동 포커스
  useEffect(() => {
    if (selected) setTimeout(() => qtyRef.current?.focus(), 50);
  }, [selected]);

  const holdingCurrency =
    !selected || selected.type === "crypto" ? "USD"
    : selected.id.endsWith(".KS") || selected.id.endsWith(".KQ") ? "KRW"
    : "USD";

  const totalCost =
    quantity && price && !isNaN(Number(quantity)) && !isNaN(Number(price))
      ? (parseFloat(quantity) * parseFloat(price)).toLocaleString(undefined, { maximumFractionDigits: 2 })
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const body: HoldingFormData = {
      asset_type: selected.type,
      symbol: selected.id,
      name: selected.name,
      image_url: selected.image ?? undefined,
      quantity: parseFloat(quantity),
      avg_buy_price: parseFloat(price),
      currency: holdingCurrency,
    };
    await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, portfolio_id: portfolioId }),
    });
    setSubmitting(false);
    setAddedCount((n) => n + 1);
    // 폼 초기화 (모달 유지, 다음 종목 바로 입력)
    setSelected(null); setQuery(""); setQuantity(""); setPrice(""); setResults([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 자산 유형 탭 */}
      <div className="flex gap-1 rounded-xl bg-gray-800 p-1">
        {(["stock", "crypto"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setAssetTab(tab)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              assetTab === tab ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab === "crypto" ? t("modal.tab.coins") : t("modal.tab.stocks")}
          </button>
        ))}
      </div>

      {/* 종목 검색 */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          {assetTab === "crypto" ? t("modal.selectCoin") : t("modal.selectStock")}
        </label>
        {selected ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-gray-800 px-3 py-2.5">
            <div className="flex items-center gap-2">
              {selected.image ? (
                <Image src={selected.image} alt={selected.name} width={24} height={24} className="rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {selected.symbol.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-white">{selected.name}</span>
              <span className="text-xs text-gray-500 uppercase">{selected.symbol}</span>
            </div>
            <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="text-gray-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={assetTab === "crypto" ? t("modal.coinPlaceholder") : t("modal.stockPlaceholder")}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
            {results.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => { setSelected(r); setResults([]); }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors"
                    >
                      {r.image ? (
                        <Image src={r.image} alt={r.name} width={20} height={20} className="rounded-full" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                          {r.symbol.charAt(0)}
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-gray-500 uppercase">{r.symbol}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 수량 + 가격 나란히 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">{t("modal.quantity")}</label>
          <input
            ref={qtyRef}
            type="number"
            step="any"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            {t("modal.avgBuyPrice")} ({holdingCurrency})
          </label>
          <input
            type="number"
            step="any"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* 총 매수금액 */}
      {totalCost && (
        <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2">
          <span className="text-xs text-gray-400">{t("modal.totalCost")}</span>
          <span className="text-sm font-semibold text-white">
            {holdingCurrency === "KRW" ? "₩" : "$"}{totalCost}
          </span>
        </div>
      )}

      {/* 추가됨 표시 */}
      {addedCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{addedCount}개 {t("modal.addedBadge")}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!selected || !quantity || !price || submitting}
        className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {submitting ? t("modal.adding") : t("modal.addAndContinue")}
      </button>
    </form>
  );
}

// ── 일괄 CSV 모드 ─────────────────────────────────────────────────────
function BulkMode({ portfolioId, onAdded }: { portfolioId: string; onAdded: () => void }) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // 심볼 유효성 검증: API 검색으로 exact match 확인 후 name/image 채움
  async function validateRows(parsed: CsvRow[]) {
    setValidating(true);
    // 유효한 행만 (format/number 오류 없는 것) 병렬 검증
    const results = await Promise.allSettled(
      parsed.map(async (row): Promise<CsvRow> => {
        if (row.error) return row;
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(row.symbol)}&type=${row.assetType === "crypto" ? "crypto" : "stock"}`
          );
          const data: SearchResult[] = await res.json();
          // exact match: id 또는 symbol 일치
          const match = data.find(
            (r) =>
              r.id.toUpperCase() === row.symbol ||
              r.symbol.toUpperCase() === row.symbol
          );
          if (!match) return { ...row, error: "invalid" };
          return {
            ...row,
            resolvedSymbol: match.id,
            name: match.name,
            imageUrl: match.image ?? undefined,
            assetType: match.type,
            currency: detectCurrency(match.id, match.type),
          };
        } catch {
          return { ...row, error: "invalid" };
        }
      })
    );
    const validated = results.map((r) => (r.status === "fulfilled" ? r.value : r.reason));
    setRows(validated);
    setValidating(false);
  }

  async function handleParse() {
    const parsed = parseCsv(text);
    // 먼저 파싱 결과를 validating 상태로 표시
    setRows(parsed.map((r) => (r.error ? r : { ...r, validating: true })));
    setSavedCount(0);
    await validateRows(parsed);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      setText(content);
      const parsed = parseCsv(content);
      setRows(parsed.map((r) => (r.error ? r : { ...r, validating: true })));
      setSavedCount(0);
      await validateRows(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  const validRows = rows.filter((r) => !r.error && !r.validating && !r.saved);

  async function handleSaveAll() {
    if (validRows.length === 0) return;
    setSaving(true);
    let count = 0;
    for (const row of validRows) {
      const body: HoldingFormData & { portfolio_id: string } = {
        portfolio_id: portfolioId,
        asset_type: row.assetType,
        symbol: row.resolvedSymbol ?? row.symbol,
        name: row.name ?? row.symbol,
        image_url: row.imageUrl,
        quantity: row.quantity,
        avg_buy_price: row.price,
        currency: row.currency,
      };
      try {
        await fetch("/api/portfolio/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setRows((prev) =>
          prev.map((r) => (r.raw === row.raw ? { ...r, saved: true } : r))
        );
        count++;
      } catch { /* keep going */ }
    }
    setSavedCount(count);
    setSaving(false);
    if (count > 0) onAdded();
  }

  return (
    <div className="space-y-4">
      {/* 형식 안내 */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2.5 space-y-1">
        <p className="text-xs font-medium text-gray-400">{t("modal.csvGuide")}</p>
        <p className="text-xs text-gray-500">{t("modal.csvExample")}</p>
      </div>

      {/* 텍스트 입력 + 파일 업로드 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setRows([]); }}
          placeholder={t("modal.csvPlaceholder")}
          rows={5}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors resize-none font-mono"
        />
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {t("modal.csvUpload")}
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={!text.trim() || validating}
            className="flex-1 rounded-lg bg-gray-700 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            {validating && <Loader2 className="h-3 w-3 animate-spin" />}
            {validating ? "검증 중..." : t("modal.csvParse")}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* 미리보기 테이블 */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-800 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">심볼</th>
                  <th className="px-2 py-2 text-right">수량</th>
                  <th className="px-2 py-2 text-right">평균매수가</th>
                  <th className="px-2 py-2 text-center">통화</th>
                  <th className="px-2 py-2 text-center">상태</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.saved ? "bg-emerald-500/5" :
                      row.error ? "bg-red-500/5" :
                      "bg-gray-900"
                    }
                  >
                    <td className="px-3 py-2 font-mono font-medium text-white">
                      <div>{row.symbol || row.raw}</div>
                      {row.name && <div className="text-xs text-gray-500 truncate max-w-[100px]">{row.name}</div>}
                    </td>
                    <td className="px-2 py-2 text-right text-gray-300">{row.error ? "—" : row.quantity}</td>
                    <td className="px-2 py-2 text-right text-gray-300">{row.error ? "—" : row.price}</td>
                    <td className="px-2 py-2 text-center text-gray-400">{row.error ? "—" : row.currency}</td>
                    <td className="px-2 py-2 text-center">
                      {row.saved ? (
                        <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-400" />
                      ) : row.validating ? (
                        <Loader2 className="mx-auto h-3.5 w-3.5 text-gray-400 animate-spin" />
                      ) : row.error ? (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {row.error === "format" ? t("modal.csvErrFormat")
                           : row.error === "number" ? t("modal.csvErrNumber")
                           : "미확인"}
                        </span>
                      ) : (
                        <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-500/60" />
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-700 bg-gray-800/50 px-3 py-2">
            <span className="text-xs text-gray-400">
              유효 <span className="text-white font-medium">{validRows.length}</span>
              {rows.filter((r) => r.error).length > 0 && (
                <span className="ml-2 text-red-400">
                  오류 {rows.filter((r) => r.error).length}
                </span>
              )}
              {savedCount > 0 && (
                <span className="ml-2 text-emerald-400">저장됨 {savedCount}</span>
              )}
            </span>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={validRows.length === 0 || saving}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-40 transition-colors"
            >
              {saving ? t("modal.csvSaving") : `${t("modal.csvSaveAll")} (${validRows.length})`}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && text.trim() === "" && (
        <p className="text-center text-xs text-gray-600 py-2">{t("modal.csvNoData")}</p>
      )}
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────────────
export function AddHoldingModal({ portfolioId, onClose, onAdded }: Props) {
  const t = useT();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center px-0 sm:px-4"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">{t("modal.addHolding")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 모드 탭 */}
        <div className="flex gap-1 rounded-xl bg-gray-800 p-1 mb-4">
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                mode === m ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "single" ? t("modal.mode.single") : t("modal.mode.bulk")}
            </button>
          ))}
        </div>

        {mode === "single" ? (
          <SingleMode portfolioId={portfolioId} onAdded={onAdded} />
        ) : (
          <BulkMode portfolioId={portfolioId} onAdded={onAdded} />
        )}
      </div>
    </div>
  );
}
