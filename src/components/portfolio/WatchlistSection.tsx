"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Star } from "lucide-react";
import { WatchlistItem } from "@/types/portfolio";

interface Props {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
}

export function WatchlistSection({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
        <Star className="h-10 w-10 text-gray-600" />
        <p className="mt-3 text-gray-400">관심 목록이 비어있습니다</p>
        <p className="mt-1 text-xs text-gray-600">코인 상세 페이지에서 ★ 버튼으로 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 hover:border-gray-700 transition-colors"
        >
          <Link href={`/crypto/${item.symbol}`} className="flex items-center gap-3 hover:opacity-80">
            {item.image_url ? (
              <Image src={item.image_url} alt={item.name} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                {item.symbol.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-white">{item.name}</p>
              <p className="text-xs text-gray-500 uppercase">{item.symbol}</p>
            </div>
          </Link>
          <button
            onClick={() => onRemove(item.symbol)}
            className="ml-2 rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
