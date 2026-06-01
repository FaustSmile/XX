import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FRED_API_KEY = process.env.FRED_API_KEY;

type FredObservation = {
  date: string;
  value: string;
};

const SERIES = [
  // 經濟成長
  {
    id: "GDP",
    name: "GDP",
    group: "經濟成長",
    unit: "B",
    format: "number",
    impact: "高",
  },

  // 流動性
  {
    id: "WRESBAL",
    name: "銀行準備金",
    group: "流動性",
    unit: "B",
    format: "number",
    impact: "高",
  },

  {
    id: "M2SL",
    name: "M2 貨幣供給",
    group: "流動性",
    unit: "B",
    format: "number",
    impact: "中",
  },

  // 利率
  {
    id: "FEDFUNDS",
    name: "Fed Funds 利率",
    group: "利率",
    unit: "%",
    format: "percent",
    impact: "極高",
  },

  {
    id: "DGS2",
    name: "2Y 美債殖利率",
    group: "利率",
    unit: "%",
    format: "percent",
    impact: "高",
  },

  // 通膨
  {
    id: "CPIAUCSL",
    name: "CPI",
    group: "通膨",
    unit: "% YoY",
    format: "yoy12",
    impact: "極高",
  },

  {
    id: "CPILFESL",
    name: "Core CPI",
    group: "通膨",
    unit: "% YoY",
    format: "yoy12",
    impact: "極高",
  },

  {
    id: "PCEPI",
    name: "PCE",
    group: "通膨",
    unit: "% YoY",
    format: "yoy12",
    impact: "高",
  },

  {
    id: "PCEPILFE",
    name: "Core PCE",
    group: "通膨",
    unit: "% YoY",
    format: "yoy12",
    impact: "極高",
  },

  {
    id: "PPIACO",
    name: "PPI",
    group: "通膨",
    unit: "% YoY",
    format: "yoy12",
    impact: "中",
  },

  // 就業
  {
    id: "PAYEMS",
    name: "非農就業 NFP",
    group: "就業",
    unit: "K",
    format: "change",
    impact: "極高",
  },

  {
    id: "UNRATE",
    name: "失業率",
    group: "就業",
    unit: "%",
    format: "percent",
    impact: "高",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFredSeries(seriesId: string): Promise<FredObservation[]> {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=120";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "force-cache",
        next: { revalidate: 21600 },
      });

      if (!res.ok) throw new Error("FRED request failed");

      const data = await res.json();

      const cleaned = (data.observations || []).filter((x: FredObservation) => {
        const n = Number(x.value);
        return x.value !== "." && Number.isFinite(n);
      });

      if (cleaned.length > 0) return cleaned;
    } catch {}

    await sleep(400 * attempt);
  }

  return [];
}

function fmtNumber(n: number) {
  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function fmtPercent(n: number) {
  if (!Number.isFinite(n)) return "—";

  return n.toFixed(2) + "%";
}

function pctYoY(latest: number, yearAgo: number) {
  return ((latest - yearAgo) / yearAgo) * 100;
}

function buildValue(series: FredObservation[], format: string) {
  const latest = Number(series[0]?.value);
  const prev = Number(series[1]?.value);

  const yearAgo12 = Number(series[12]?.value);
  const prevYearAgo12 = Number(series[13]?.value);

  if (format === "percent") {
    return {
      actual: fmtPercent(latest),
      previous: fmtPercent(prev),
    };
  }

  if (format === "yoy12") {
    return {
      actual:
        Number.isFinite(latest) && Number.isFinite(yearAgo12)
          ? fmtPercent(pctYoY(latest, yearAgo12))
          : "—",

      previous:
        Number.isFinite(prev) && Number.isFinite(prevYearAgo12)
          ? fmtPercent(pctYoY(prev, prevYearAgo12))
          : "—",
    };
  }

  if (format === "change") {
    const change = latest - prev;

    return {
      actual: Number.isFinite(change)
        ? fmtNumber(change) + "K"
        : "—",

      previous: Number.isFinite(prev)
        ? "上月總量：" + fmtNumber(prev) + "K"
        : "—",
    };
  }

  return {
    actual: fmtNumber(latest),
    previous: fmtNumber(prev),
  };
}

async function buildItem(s: any) {
  const data = await getFredSeries(s.id);

  const value = buildValue(data, s.format);

  return {
    id: s.id,
    name: s.name,
    group: s.group,
    actual: value.actual,
    previous: value.previous,
    unit: s.unit,
    impact: s.impact,
    time: "最近有效日期：" + (data[0]?.date || "—"),
    source: data.length > 0 ? "FRED" : "FRED 未回傳",
  };
}

export async function GET() {
  if (!FRED_API_KEY) {
    return NextResponse.json({
      error: "尚未設定 FRED_API_KEY",
      items: [],
    });
  }

  try {
    const items = [];

    for (const s of SERIES) {
      const item = await buildItem(s);

      items.push(item);

      await sleep(150);
    }

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      items,
    });
  } catch {
    return NextResponse.json({
      error: "FRED API 讀取失敗",
      items: [],
    });
  }
}
