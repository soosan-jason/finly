import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Finly - 통합 금융 정보 플랫폼",
  description: "주식, ETF, 암호화폐를 한 곳에서. 실시간 시장 데이터와 포트폴리오 관리.",
  keywords: ["주식", "ETF", "암호화폐", "비트코인", "코스피", "나스닥", "포트폴리오"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-gray-950 text-white antialiased font-sans">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
