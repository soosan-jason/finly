import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finly - 통합 금융 정보 플랫폼",
    short_name: "Finly",
    description: "주식·ETF·암호화폐를 한 곳에서. 실시간 시장 데이터와 포트폴리오 관리.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#10b981",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    lang: "ko",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "시장 지수",
        url: "/markets",
        description: "글로벌 시장 지수 확인",
      },
      {
        name: "암호화폐",
        url: "/crypto",
        description: "암호화폐 시세 확인",
      },
      {
        name: "포트폴리오",
        url: "/portfolio",
        description: "내 포트폴리오 관리",
      },
    ],
    screenshots: [],
  };
}
