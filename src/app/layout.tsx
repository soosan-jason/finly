import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://finly.vercel.app";

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Finly - 통합 금융 정보 플랫폼",
    template: "%s | Finly",
  },
  description:
    "주식·ETF·암호화폐를 한 곳에서. 실시간 글로벌 시장 데이터, 포트폴리오 관리, 금융 뉴스를 무료로 제공합니다.",
  keywords: [
    "주식", "ETF", "암호화폐", "비트코인", "이더리움",
    "코스피", "나스닥", "S&P500", "포트폴리오", "금융", "투자", "환율",
  ],
  authors: [{ name: "Finly" }],
  creator: "Finly",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: APP_URL,
    siteName: "Finly",
    title: "Finly - 통합 금융 정보 플랫폼",
    description: "주식·ETF·암호화폐를 한 곳에서. 실시간 글로벌 시장 데이터와 포트폴리오 관리.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Finly" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finly - 통합 금융 정보 플랫폼",
    description: "주식·ETF·암호화폐를 한 곳에서. 실시간 글로벌 시장 데이터.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
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
