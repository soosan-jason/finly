"use client";

import { useEffect, useState } from "react";
import { BondYield } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatTime, formatMonthDay } from "@/lib/utils/format";
import { useDateFormat } from "@/contexts/DateFormatContext";

export function BondsSection() {
  const { showDate } = useDateFormat();
  const [bonds, setBonds] = useState<BondYield[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/markets/bonds");
        setBonds(await res.json());
      } catch {
        // fallback은 API에서 처리
      } finally {
        setLoading(false);
      }
    }
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, []);

  const usBonds = bonds
    .filter((b) => b.country === "US")
    .sort((a, b) => a.maturityMonths - b.maturityMonths);
  const otherBonds = bonds.filter((b) => b.country !== "US");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl bg-gray-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 수익률 곡선 */}
      {usBonds.length >= 2 && (
        <Card>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            미국 국채 수익률 곡선
          </p>
          <YieldCurveChart bonds={usBonds} />
        </Card>
      )}

      {/* US 국채 */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          미국 국채
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {usBonds.map((bond) => (
            <BondCard key={bond.symbol} bond={bond} />
          ))}
        </div>
      </section>

      {/* 기타 국채 */}
      {otherBonds.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              기타
            </h2>
            {otherBonds.some((b) => b.lastUpdated) && (
              <span className="text-xs text-gray-500">
                연동{" "}
                {(() => {
                  const iso = otherBonds
                    .filter((b) => b.lastUpdated)
                    .sort(
                      (a, b) =>
                        new Date(b.lastUpdated!).getTime() -
                        new Date(a.lastUpdated!).getTime()
                    )[0].lastUpdated;
                  return showDate ? formatMonthDay(iso!) : formatTime(iso!);
                })()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {otherBonds.map((bond) => (
              <BondCard key={bond.symbol} bond={bond} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


function BondCard({ bond }: { bond: BondYield }) {
  const up = bond.change >= 0;
  return (
    <Card className="flex flex-col justify-between">
      <p className="text-xs text-gray-500">{bond.label}</p>
      <div className="mt-2">
        <p className="text-lg font-bold text-white">{bond.yield.toFixed(2)}%</p>
        <div className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
          <span>{up ? "+" : ""}{bond.change.toFixed(2)}bp</span>
          {bond.changePct != null && (
            <span className={`rounded px-1 py-0.5 tabular-nums ${up ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {up ? "+" : ""}{bond.changePct.toFixed(2)}%
            </span>
          )}
        </div>
        {bond.lastUpdated && (
          <p className="mt-1 text-xs text-gray-500">
            {showDate ? formatMonthDay(bond.lastUpdated) : formatTime(bond.lastUpdated)}
          </p>
        )}
      </div>
    </Card>
  );
}

function YieldCurveChart({ bonds }: { bonds: BondYield[] }) {
  const W = 560;
  const H = 140;
  const PAD = { top: 16, right: 24, bottom: 28, left: 40 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minY = Math.min(...bonds.map((b) => b.yield)) - 0.2;
  const maxY = Math.max(...bonds.map((b) => b.yield)) + 0.2;

  // x positions: equally spaced by index
  const xPos = (i: number) => PAD.left + (i / (bonds.length - 1)) * chartW;
  const yPos = (y: number) => PAD.top + chartH - ((y - minY) / (maxY - minY)) * chartH;

  const points = bonds.map((b, i) => `${xPos(i)},${yPos(b.yield)}`).join(" ");

  // y-axis gridlines
  const yTicks = 4;
  const yStep = (maxY - minY) / yTicks;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 140 }}
      aria-label="미국 국채 수익률 곡선"
    >
      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const yVal = minY + i * yStep;
        const y = yPos(yVal);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#374151" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="10">
              {yVal.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <polygon
        points={`${PAD.left},${PAD.top + chartH} ${points} ${W - PAD.right},${PAD.top + chartH}`}
        fill="url(#yieldGrad)"
        opacity="0.25"
      />

      {/* Curve */}
      <polyline points={points} fill="none" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" />

      {/* Dots + labels */}
      {bonds.map((b, i) => (
        <g key={b.symbol}>
          <circle cx={xPos(i)} cy={yPos(b.yield)} r="3" fill="#34D399" />
          <text x={xPos(i)} y={H - 4} textAnchor="middle" fill="#9CA3AF" fontSize="10">
            {b.label}
          </text>
        </g>
      ))}

      <defs>
        <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
