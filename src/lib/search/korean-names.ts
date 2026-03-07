/** 한국어 이름으로 검색 가능한 자산 사전 */

export interface KoreanEntry {
  type: "crypto" | "stock" | "etf";
  id: string;       // CoinGecko ID or Yahoo/Finnhub symbol
  symbol: string;
  name: string;     // 영문명
  nameKo: string;   // 한국어명 (검색 대상)
  market_cap_rank: number | null;
}

// ────────────────────────────────────────────────────────
// 암호화폐 (CoinGecko ID 기준)
// ────────────────────────────────────────────────────────
export const KOREAN_COINS: KoreanEntry[] = [
  { type:"crypto", id:"bitcoin",               symbol:"BTC",   name:"Bitcoin",              nameKo:"비트코인",         market_cap_rank:1   },
  { type:"crypto", id:"ethereum",              symbol:"ETH",   name:"Ethereum",             nameKo:"이더리움",         market_cap_rank:2   },
  { type:"crypto", id:"tether",                symbol:"USDT",  name:"Tether",               nameKo:"테더",             market_cap_rank:3   },
  { type:"crypto", id:"binancecoin",           symbol:"BNB",   name:"BNB",                  nameKo:"바이낸스코인",      market_cap_rank:4   },
  { type:"crypto", id:"solana",                symbol:"SOL",   name:"Solana",               nameKo:"솔라나",           market_cap_rank:5   },
  { type:"crypto", id:"ripple",                symbol:"XRP",   name:"XRP",                  nameKo:"리플",             market_cap_rank:6   },
  { type:"crypto", id:"usd-coin",              symbol:"USDC",  name:"USD Coin",             nameKo:"USD코인",          market_cap_rank:7   },
  { type:"crypto", id:"cardano",               symbol:"ADA",   name:"Cardano",              nameKo:"에이다",           market_cap_rank:8   },
  { type:"crypto", id:"avalanche-2",           symbol:"AVAX",  name:"Avalanche",            nameKo:"아발란체",         market_cap_rank:9   },
  { type:"crypto", id:"dogecoin",              symbol:"DOGE",  name:"Dogecoin",             nameKo:"도지코인",         market_cap_rank:10  },
  { type:"crypto", id:"polkadot",              symbol:"DOT",   name:"Polkadot",             nameKo:"폴카닷",           market_cap_rank:11  },
  { type:"crypto", id:"tron",                  symbol:"TRX",   name:"TRON",                 nameKo:"트론",             market_cap_rank:12  },
  { type:"crypto", id:"chainlink",             symbol:"LINK",  name:"Chainlink",            nameKo:"체인링크",         market_cap_rank:13  },
  { type:"crypto", id:"matic-network",         symbol:"MATIC", name:"Polygon",              nameKo:"폴리곤",           market_cap_rank:14  },
  { type:"crypto", id:"litecoin",              symbol:"LTC",   name:"Litecoin",             nameKo:"라이트코인",        market_cap_rank:15  },
  { type:"crypto", id:"shiba-inu",             symbol:"SHIB",  name:"Shiba Inu",            nameKo:"시바이누",         market_cap_rank:16  },
  { type:"crypto", id:"uniswap",               symbol:"UNI",   name:"Uniswap",              nameKo:"유니스왑",         market_cap_rank:17  },
  { type:"crypto", id:"cosmos",                symbol:"ATOM",  name:"Cosmos",               nameKo:"코스모스",         market_cap_rank:18  },
  { type:"crypto", id:"monero",                symbol:"XMR",   name:"Monero",               nameKo:"모네로",           market_cap_rank:19  },
  { type:"crypto", id:"ethereum-classic",      symbol:"ETC",   name:"Ethereum Classic",     nameKo:"이더리움클래식",    market_cap_rank:20  },
  { type:"crypto", id:"stellar",               symbol:"XLM",   name:"Stellar",              nameKo:"스텔라루멘",        market_cap_rank:21  },
  { type:"crypto", id:"bitcoin-cash",          symbol:"BCH",   name:"Bitcoin Cash",         nameKo:"비트코인캐시",      market_cap_rank:22  },
  { type:"crypto", id:"near",                  symbol:"NEAR",  name:"NEAR Protocol",        nameKo:"니어프로토콜",      market_cap_rank:23  },
  { type:"crypto", id:"aptos",                 symbol:"APT",   name:"Aptos",                nameKo:"앱토스",           market_cap_rank:24  },
  { type:"crypto", id:"sui",                   symbol:"SUI",   name:"Sui",                  nameKo:"수이",             market_cap_rank:25  },
  { type:"crypto", id:"the-sandbox",           symbol:"SAND",  name:"The Sandbox",          nameKo:"샌드박스",         market_cap_rank:26  },
  { type:"crypto", id:"decentraland",          symbol:"MANA",  name:"Decentraland",         nameKo:"디센트럴랜드",      market_cap_rank:27  },
  { type:"crypto", id:"aave",                  symbol:"AAVE",  name:"Aave",                 nameKo:"에이브",           market_cap_rank:28  },
  { type:"crypto", id:"filecoin",              symbol:"FIL",   name:"Filecoin",             nameKo:"파일코인",         market_cap_rank:29  },
  { type:"crypto", id:"internet-computer",     symbol:"ICP",   name:"Internet Computer",    nameKo:"인터넷컴퓨터",      market_cap_rank:30  },
  { type:"crypto", id:"arbitrum",              symbol:"ARB",   name:"Arbitrum",             nameKo:"아비트럼",         market_cap_rank:31  },
  { type:"crypto", id:"optimism",              symbol:"OP",    name:"Optimism",             nameKo:"옵티미즘",         market_cap_rank:32  },
  { type:"crypto", id:"maker",                 symbol:"MKR",   name:"Maker",                nameKo:"메이커",           market_cap_rank:33  },
  { type:"crypto", id:"curve-dao-token",       symbol:"CRV",   name:"Curve DAO Token",      nameKo:"커브",             market_cap_rank:34  },
  { type:"crypto", id:"klay-token",            symbol:"KLAY",  name:"Klaytn",               nameKo:"클레이튼",         market_cap_rank:35  },
  { type:"crypto", id:"wemix-token",           symbol:"WEMIX", name:"WEMIX",                nameKo:"위믹스",           market_cap_rank:36  },
  { type:"crypto", id:"helium",                symbol:"HNT",   name:"Helium",               nameKo:"헬리움",           market_cap_rank:37  },
  { type:"crypto", id:"zilliqa",               symbol:"ZIL",   name:"Zilliqa",              nameKo:"질리카",           market_cap_rank:38  },
  { type:"crypto", id:"eos",                   symbol:"EOS",   name:"EOS",                  nameKo:"이오스",           market_cap_rank:39  },
  { type:"crypto", id:"iota",                  symbol:"IOTA",  name:"IOTA",                 nameKo:"아이오타",         market_cap_rank:40  },
  { type:"crypto", id:"terra-luna-2",          symbol:"LUNA",  name:"Terra",                nameKo:"테라루나",         market_cap_rank:41  },
  { type:"crypto", id:"icon",                  symbol:"ICX",   name:"ICON",                 nameKo:"아이콘",           market_cap_rank:42  },
  { type:"crypto", id:"compound-governance-token", symbol:"COMP", name:"Compound",          nameKo:"컴파운드",         market_cap_rank:43  },
  { type:"crypto", id:"celo",                  symbol:"CELO",  name:"Celo",                 nameKo:"셀로",             market_cap_rank:44  },
  { type:"crypto", id:"pepe",                  symbol:"PEPE",  name:"Pepe",                 nameKo:"페페",             market_cap_rank:45  },
  { type:"crypto", id:"floki",                 symbol:"FLOKI", name:"FLOKI",                nameKo:"플로키",           market_cap_rank:46  },
  { type:"crypto", id:"bonk",                  symbol:"BONK",  name:"Bonk",                 nameKo:"봉크",             market_cap_rank:47  },
  { type:"crypto", id:"sei-network",           symbol:"SEI",   name:"Sei",                  nameKo:"세이",             market_cap_rank:48  },
  { type:"crypto", id:"injective-protocol",    symbol:"INJ",   name:"Injective",            nameKo:"인젝티브",         market_cap_rank:49  },
  { type:"crypto", id:"stacks",                symbol:"STX",   name:"Stacks",               nameKo:"스택스",           market_cap_rank:50  },
  { type:"crypto", id:"render-token",          symbol:"RNDR",  name:"Render",               nameKo:"렌더",             market_cap_rank:51  },
  { type:"crypto", id:"fetch-ai",              symbol:"FET",   name:"Fetch.ai",             nameKo:"페치",             market_cap_rank:52  },
];

// ────────────────────────────────────────────────────────
// 한국 주식 (Yahoo Finance 심볼 기준, .KS / .KQ)
// ────────────────────────────────────────────────────────
export const KOREAN_STOCKS: KoreanEntry[] = [
  // 코스피 대형주
  { type:"stock", id:"005930.KS", symbol:"005930.KS", name:"Samsung Electronics",    nameKo:"삼성전자",        market_cap_rank:null },
  { type:"stock", id:"000660.KS", symbol:"000660.KS", name:"SK Hynix",               nameKo:"SK하이닉스",      market_cap_rank:null },
  { type:"stock", id:"373220.KS", symbol:"373220.KS", name:"LG Energy Solution",     nameKo:"LG에너지솔루션",  market_cap_rank:null },
  { type:"stock", id:"207940.KS", symbol:"207940.KS", name:"Samsung Biologics",      nameKo:"삼성바이오로직스", market_cap_rank:null },
  { type:"stock", id:"005380.KS", symbol:"005380.KS", name:"Hyundai Motor",          nameKo:"현대차",          market_cap_rank:null },
  { type:"stock", id:"000270.KS", symbol:"000270.KS", name:"Kia",                    nameKo:"기아",            market_cap_rank:null },
  { type:"stock", id:"005490.KS", symbol:"005490.KS", name:"POSCO Holdings",         nameKo:"포스코홀딩스",     market_cap_rank:null },
  { type:"stock", id:"006400.KS", symbol:"006400.KS", name:"Samsung SDI",            nameKo:"삼성SDI",         market_cap_rank:null },
  { type:"stock", id:"051910.KS", symbol:"051910.KS", name:"LG Chem",                nameKo:"LG화학",          market_cap_rank:null },
  { type:"stock", id:"035420.KS", symbol:"035420.KS", name:"NAVER",                  nameKo:"네이버",          market_cap_rank:null },
  { type:"stock", id:"035720.KS", symbol:"035720.KS", name:"Kakao",                  nameKo:"카카오",          market_cap_rank:null },
  { type:"stock", id:"068270.KS", symbol:"068270.KS", name:"Celltrion",              nameKo:"셀트리온",        market_cap_rank:null },
  { type:"stock", id:"105560.KS", symbol:"105560.KS", name:"KB Financial",           nameKo:"KB금융",          market_cap_rank:null },
  { type:"stock", id:"055550.KS", symbol:"055550.KS", name:"Shinhan Financial",      nameKo:"신한지주",        market_cap_rank:null },
  { type:"stock", id:"086790.KS", symbol:"086790.KS", name:"Hana Financial",         nameKo:"하나금융지주",     market_cap_rank:null },
  { type:"stock", id:"066570.KS", symbol:"066570.KS", name:"LG Electronics",         nameKo:"LG전자",          market_cap_rank:null },
  { type:"stock", id:"012330.KS", symbol:"012330.KS", name:"Hyundai Mobis",          nameKo:"현대모비스",       market_cap_rank:null },
  { type:"stock", id:"017670.KS", symbol:"017670.KS", name:"SK Telecom",             nameKo:"SK텔레콤",         market_cap_rank:null },
  { type:"stock", id:"030200.KS", symbol:"030200.KS", name:"KT",                     nameKo:"KT",              market_cap_rank:null },
  { type:"stock", id:"015760.KS", symbol:"015760.KS", name:"KEPCO",                  nameKo:"한국전력",        market_cap_rank:null },
  { type:"stock", id:"032830.KS", symbol:"032830.KS", name:"Samsung Life Insurance", nameKo:"삼성생명",        market_cap_rank:null },
  { type:"stock", id:"003550.KS", symbol:"003550.KS", name:"LG Corp",                nameKo:"LG",              market_cap_rank:null },
  { type:"stock", id:"096770.KS", symbol:"096770.KS", name:"SK Innovation",          nameKo:"SK이노베이션",     market_cap_rank:null },
  { type:"stock", id:"010950.KS", symbol:"010950.KS", name:"S-Oil",                  nameKo:"S-Oil",           market_cap_rank:null },
  { type:"stock", id:"011200.KS", symbol:"011200.KS", name:"HMM",                    nameKo:"HMM",             market_cap_rank:null },
  { type:"stock", id:"036460.KS", symbol:"036460.KS", name:"Korea Gas",              nameKo:"한국가스공사",     market_cap_rank:null },
  { type:"stock", id:"032640.KS", symbol:"032640.KS", name:"LG Uplus",               nameKo:"LG유플러스",       market_cap_rank:null },
  { type:"stock", id:"018260.KS", symbol:"018260.KS", name:"Samsung SDS",            nameKo:"삼성SDS",         market_cap_rank:null },
  { type:"stock", id:"009150.KS", symbol:"009150.KS", name:"Samsung Electro-Mech",   nameKo:"삼성전기",        market_cap_rank:null },
  { type:"stock", id:"316140.KS", symbol:"316140.KS", name:"Woori Financial",        nameKo:"우리금융지주",     market_cap_rank:null },
  { type:"stock", id:"003490.KS", symbol:"003490.KS", name:"Korean Air",             nameKo:"대한항공",        market_cap_rank:null },
  { type:"stock", id:"020150.KS", symbol:"020150.KS", name:"Doosan Enerbility",      nameKo:"두산에너빌리티",   market_cap_rank:null },
  { type:"stock", id:"001570.KS", symbol:"001570.KS", name:"Kumyang",                nameKo:"금양",            market_cap_rank:null },
  { type:"stock", id:"042700.KS", symbol:"042700.KS", name:"Hanmi Semiconductor",    nameKo:"한미반도체",       market_cap_rank:null },
  // 코스닥
  { type:"stock", id:"247540.KQ", symbol:"247540.KQ", name:"Ecopro BM",              nameKo:"에코프로비엠",     market_cap_rank:null },
  { type:"stock", id:"086520.KQ", symbol:"086520.KQ", name:"Ecopro",                 nameKo:"에코프로",        market_cap_rank:null },
  { type:"stock", id:"196170.KQ", symbol:"196170.KQ", name:"Alteogen",               nameKo:"알테오젠",        market_cap_rank:null },
  { type:"stock", id:"041510.KQ", symbol:"041510.KQ", name:"SM Entertainment",       nameKo:"SM엔터테인먼트",   market_cap_rank:null },
  { type:"stock", id:"035900.KQ", symbol:"035900.KQ", name:"JYP Entertainment",      nameKo:"JYP엔터테인먼트",  market_cap_rank:null },
  { type:"stock", id:"352820.KQ", symbol:"352820.KQ", name:"HYBE",                   nameKo:"하이브",          market_cap_rank:null },
  { type:"stock", id:"263750.KQ", symbol:"263750.KQ", name:"Pearl Abyss",            nameKo:"펄어비스",        market_cap_rank:null },
  { type:"stock", id:"112040.KQ", symbol:"112040.KQ", name:"Wemade",                 nameKo:"위메이드",        market_cap_rank:null },
  { type:"stock", id:"293490.KQ", symbol:"293490.KQ", name:"Kakao Games",            nameKo:"카카오게임즈",     market_cap_rank:null },
  { type:"stock", id:"323410.KQ", symbol:"323410.KQ", name:"Kakao Bank",             nameKo:"카카오뱅크",       market_cap_rank:null },
];

// ────────────────────────────────────────────────────────
// 미국 주식 (한국어 명칭으로 많이 검색되는 종목)
// ────────────────────────────────────────────────────────
export const KOREAN_US_STOCKS: KoreanEntry[] = [
  { type:"stock", id:"AAPL",  symbol:"AAPL",  name:"Apple",              nameKo:"애플",          market_cap_rank:null },
  { type:"stock", id:"MSFT",  symbol:"MSFT",  name:"Microsoft",          nameKo:"마이크로소프트",  market_cap_rank:null },
  { type:"stock", id:"GOOGL", symbol:"GOOGL", name:"Alphabet (Google)",  nameKo:"구글",           market_cap_rank:null },
  { type:"stock", id:"GOOG",  symbol:"GOOG",  name:"Alphabet (Google)",  nameKo:"알파벳",         market_cap_rank:null },
  { type:"stock", id:"AMZN",  symbol:"AMZN",  name:"Amazon",             nameKo:"아마존",         market_cap_rank:null },
  { type:"stock", id:"NVDA",  symbol:"NVDA",  name:"NVIDIA",             nameKo:"엔비디아",       market_cap_rank:null },
  { type:"stock", id:"META",  symbol:"META",  name:"Meta Platforms",     nameKo:"메타",           market_cap_rank:null },
  { type:"stock", id:"TSLA",  symbol:"TSLA",  name:"Tesla",              nameKo:"테슬라",         market_cap_rank:null },
  { type:"stock", id:"NFLX",  symbol:"NFLX",  name:"Netflix",            nameKo:"넷플릭스",       market_cap_rank:null },
  { type:"stock", id:"INTC",  symbol:"INTC",  name:"Intel",              nameKo:"인텔",           market_cap_rank:null },
  { type:"stock", id:"AMD",   symbol:"AMD",   name:"AMD",                nameKo:"AMD",            market_cap_rank:null },
  { type:"stock", id:"QCOM",  symbol:"QCOM",  name:"Qualcomm",           nameKo:"퀄컴",           market_cap_rank:null },
  { type:"stock", id:"ORCL",  symbol:"ORCL",  name:"Oracle",             nameKo:"오라클",         market_cap_rank:null },
  { type:"stock", id:"CRM",   symbol:"CRM",   name:"Salesforce",         nameKo:"세일즈포스",      market_cap_rank:null },
  { type:"stock", id:"ADBE",  symbol:"ADBE",  name:"Adobe",              nameKo:"어도비",         market_cap_rank:null },
  { type:"stock", id:"PYPL",  symbol:"PYPL",  name:"PayPal",             nameKo:"페이팔",         market_cap_rank:null },
  { type:"stock", id:"V",     symbol:"V",     name:"Visa",               nameKo:"비자",           market_cap_rank:null },
  { type:"stock", id:"MA",    symbol:"MA",    name:"Mastercard",         nameKo:"마스터카드",      market_cap_rank:null },
  { type:"stock", id:"JPM",   symbol:"JPM",   name:"JPMorgan Chase",     nameKo:"JP모건",         market_cap_rank:null },
  { type:"stock", id:"BAC",   symbol:"BAC",   name:"Bank of America",    nameKo:"뱅크오브아메리카", market_cap_rank:null },
  { type:"stock", id:"GS",    symbol:"GS",    name:"Goldman Sachs",      nameKo:"골드만삭스",      market_cap_rank:null },
  { type:"stock", id:"DIS",   symbol:"DIS",   name:"Disney",             nameKo:"디즈니",         market_cap_rank:null },
  { type:"stock", id:"SBUX",  symbol:"SBUX",  name:"Starbucks",          nameKo:"스타벅스",       market_cap_rank:null },
  { type:"stock", id:"SPOT",  symbol:"SPOT",  name:"Spotify",            nameKo:"스포티파이",      market_cap_rank:null },
  { type:"stock", id:"UBER",  symbol:"UBER",  name:"Uber",               nameKo:"우버",           market_cap_rank:null },
  { type:"stock", id:"ABNB",  symbol:"ABNB",  name:"Airbnb",             nameKo:"에어비앤비",      market_cap_rank:null },
  { type:"stock", id:"COIN",  symbol:"COIN",  name:"Coinbase",           nameKo:"코인베이스",      market_cap_rank:null },
  { type:"stock", id:"PLTR",  symbol:"PLTR",  name:"Palantir",           nameKo:"팔란티어",        market_cap_rank:null },
  { type:"stock", id:"ARM",   symbol:"ARM",   name:"Arm Holdings",       nameKo:"ARM",            market_cap_rank:null },
  { type:"stock", id:"TSM",   symbol:"TSM",   name:"TSMC",               nameKo:"TSMC",           market_cap_rank:null },
  { type:"stock", id:"ASML",  symbol:"ASML",  name:"ASML",               nameKo:"ASML",           market_cap_rank:null },
  { type:"stock", id:"BRK-B", symbol:"BRK-B", name:"Berkshire Hathaway", nameKo:"버크셔해서웨이",  market_cap_rank:null },
  { type:"stock", id:"WMT",   symbol:"WMT",   name:"Walmart",            nameKo:"월마트",         market_cap_rank:null },
  { type:"stock", id:"XOM",   symbol:"XOM",   name:"ExxonMobil",         nameKo:"엑슨모빌",       market_cap_rank:null },
  { type:"stock", id:"CVX",   symbol:"CVX",   name:"Chevron",            nameKo:"셰브론",         market_cap_rank:null },
  { type:"stock", id:"MRNA",  symbol:"MRNA",  name:"Moderna",            nameKo:"모더나",         market_cap_rank:null },
  { type:"stock", id:"PFE",   symbol:"PFE",   name:"Pfizer",             nameKo:"화이자",         market_cap_rank:null },
  { type:"stock", id:"JNJ",   symbol:"JNJ",   name:"Johnson & Johnson",  nameKo:"존슨앤드존슨",    market_cap_rank:null },
  { type:"stock", id:"SPCE",  symbol:"SPCE",  name:"Virgin Galactic",    nameKo:"버진갤럭틱",      market_cap_rank:null },
];

/** 한글 문자 포함 여부 */
export function isKorean(str: string): boolean {
  return /[\uAC00-\uD7A3]/.test(str);
}

/** 한국어 검색: nameKo 또는 name(영문)이 쿼리를 포함하는 항목 반환 */
export function searchKoreanDict(query: string): KoreanEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const all = [...KOREAN_COINS, ...KOREAN_STOCKS, ...KOREAN_US_STOCKS];
  return all
    .filter((entry) =>
      entry.nameKo.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.symbol.toLowerCase().includes(q)
    )
    .slice(0, 8);
}
