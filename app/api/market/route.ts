import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FRED_API_KEY = process.env.FRED_API_KEY;

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "—";
  return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
}

async function getFinnhubQuote(symbol: string, label = symbol) {
  const url =
    "https://finnhub.io/api/v1/quote?symbol=" +
    encodeURIComponent(symbol) +
    "&token=" +
    FINNHUB_API_KEY;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const current = Number(data.c);
  const previousClose = Number(data.pc);

  const displayValue =
    Number.isFinite(current) && current > 0
      ? current
      : Number.isFinite(previousClose) && previousClose > 0
      ? previousClose
      : NaN;

  const changePercent =
    Number.isFinite(current) &&
    current > 0 &&
    Number.isFinite(previousClose) &&
    previousClose > 0
      ? ((current - previousClose) / previousClose) * 100
      : 0;

  return {
    label,
    value: formatNumber(displayValue),
    chg: Number.isFinite(changePercent) ? formatChange(changePercent) : "—",
    status: changePercent >= 0 ? "up" : "down",
    source:
      Number.isFinite(current) && current > 0
        ? "Finnhub 最新價"
        : "Finnhub 前收盤",
  };
}

async function getFredLatest(seriesId: string, label: string) {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=60";

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  const data = await res.json();

  const observations = (data.observations || []).filter((x: any) => {
    const n = Number(x.value);
    return x.value !== "." && Number.isFinite(n);
  });

  const latest = Number(observations[0]?.value);
  const previous = Number(observations[1]?.value);

  const changePercent =
    Number.isFinite(latest) &&
    Number.isFinite(previous) &&
    previous !== 0
      ? ((latest - previous) / previous) * 100
      : 0;

  return {
    label,
    value: formatNumber(latest),
    chg: formatChange(changePercent),
    status: changePercent >= 0 ? "up" : "down",
    source: "FRED 最近有效數據",
  };
}

export async function GET() {
  try {
    const results = await Promise.all([
      getFinnhubQuote("SPY", "SPY"),
      getFinnhubQuote("QQQ", "QQQ"),

      getFredLatest("VIXCLS", "VIX"),
      getFredLatest("DGS10", "10Y"),
      getFredLatest("DTWEXBGS", "DXY"),
      getFredLatest("DCOILWTICO", "WTI"),
    ]);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([
      { label: "SPY", value: "—", chg: "—", status: "down", source: "Error" },
      { label: "QQQ", value: "—", chg: "—", status: "down", source: "Error" },
      { label: "VIX", value: "—", chg: "—", status: "down", source: "Error" },
      { label: "10Y", value: "—", chg: "—", status: "down", source: "Error" },
      { label: "DXY", value: "—", chg: "—", status: "down", source: "Error" },
      { label: "WTI", value: "—", chg: "—", status: "down", source: "Error" },
    ]);
  }
}
