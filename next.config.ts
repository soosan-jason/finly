import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com",      pathname: "/coins/images/**" },
      { protocol: "https", hostname: "coin-images.coingecko.com", pathname: "/coins/images/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // 번들 크기 로그 (개발 환경에서 확인 가능)
  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === "development" },
  },
};

export default nextConfig;
