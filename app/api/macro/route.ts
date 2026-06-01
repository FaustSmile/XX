import { NextResponse } from "next/server";

const FRED_API_KEY = process.env.FRED_API_KEY;

type FredObservation = {
  date: string;
  value: string;
};

const SERIES = [
  { id: "GDP", name: "GDP", group: "經濟成長", unit: "B", format: "number", impact: "高" },
  { id: "WTREGEN", name: "TGA 美國財政部帳戶", group: "流動性", unit: "B", format: "number", impact: "高" },
  { id: "WRESBAL", name: "銀行準備金", group: "流動性", unit: "B", format: "number", impact: "高" },
  { id: "M2SL", name: "M2 貨幣供給", group: "流動性", unit: "B", format: "number", impact: "中" },

  { id: "FEDFUNDS", name: "Fed Funds 利率", group: "利率", unit: "%", format: "percent", impact: "極高" },
  { id: "DGS10", name: "10Y 美債殖利率", group: "利率", unit: "%", format: "percent", impact: "極高" },
  { id: "DGS2", name: "2Y 美債殖利率", group: "利率", unit: "%", format: "percent", impact: "高" },

  { id: "CPIAUCSL", name: "CPI", group: "通膨", unit: "% YoY", format: "yoy", impact: "極高" },
  { id: "CPILFESL", name: "Core CPI", group: "通膨", unit: "% YoY", format: "yoy", impact: "極高" },
  { id: "PCEPI", name: "PCE", group: "通膨", unit: "% YoY", format: "yoy", impact: "高" },
  { id: "PCEPILFE", name: "Core PCE", group: "通膨", unit: "% YoY", format: "yoy", impact: "極高" },
  { id: "PPIACO", name: "PPI", group: "通膨", unit: "% YoY", format: "yoy", impact: "中" },

  { id: "PAYEMS", name: "非農就業 NFP", group: "就業", unit: "K", format: "change", impact: "極高" },
  { id: "UNRATE", name: "失業率", group: "就業", unit: "%", format: "percent", impact: "高" },

  { id: "VIXCLS", name: "VIX 恐慌指數", group: "市場風險", unit: "", format: "number", impact: "高" },
  { id: "DTWEXBGS", name: "美元指數 DXY", group: "市場風險", unit: "", format: "number", impact: "高" },
  { id: "DCOILWTICO", name: "WTI 原油", group: "市場風險", unit: "USD", format: "number", impact: "中" },
];

async function getFredSeries(seriesId: string): Promise<FredObservation[]> {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=120";

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  return (data.observations || []).filter((x: FredObservation) => {
    const n = Number(x.value);
    return x.value !== "." && Number.isFinite(n);
  });
}

function fmtNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
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
  const yearAgo = Number(series[12]?.value);
  const prevYearAgo = Number(series[13]?.value);

  if (format === "percent") {
    return {
      actual: fmtPercent(latest),
      previous: fmtPercent(prev),
    };
  }

  if (format === "yoy") {
    return {
      actual: Number.isFinite(latest) && Number.isFinite(yearAgo) ? fmtPercent(pctYoY(latest, yearAgo)) : "—",
      previous: Number.isFinite(prev) && Number.isFinite(prevYearAgo) ? fmtPercent(pctYoY(prev, prevYearAgo)) : "—",
    };
  }

  if (format === "change") {
    const change = latest - prev;
    return {
      actual: Number.isFinite(change) ? fmtNumber(change) + "K" : "—",
      previous: Number.isFinite(prev) ? "上月總量：" + fmtNumber(prev) + "K" : "—",
    };
  }

  return {
    actual: fmtNumber(latest),
    previous: fmtNumber(prev),
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
    const items = await Promise.all(
      SERIES.map(async (s) => {
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
          source: "FRED",
        };
      })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({
      error: "FRED API 讀取失敗",
      items: [],
    });
  }
}
