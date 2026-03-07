import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// script-src: 'unsafe-eval'은 개발(HMR)에서만 허용
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  // 코인 이미지 CDN + OAuth 프로바이더 아바타
  "img-src 'self' data: blob: https://assets.coingecko.com https://coin-images.coingecko.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://avatars.googleusercontent.com",
  "font-src 'self'",
  // Supabase REST/Realtime
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // OAuth 로그인 리다이렉트
  "form-action 'self' https://*.supabase.co",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
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
