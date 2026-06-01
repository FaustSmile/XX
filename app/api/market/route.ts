import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FRED_API_KEY = process.env.FRED_API_KEY;

async function getFinnhubQuote(symbol: string, label = symbol) {
  const url =
    "https://finnhub.io/api/v1/quote?symbol=" +
    encodeURIComponent(symbol) +
    "&token=" +
    FINNHUB_API_KEY;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const current = Number(data.c || 0);
  const previous = Number(data.pc || 0);

  const changePercent =
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    label,
    value: current ? current.toFixed(2) : "—",
    chg:
      previous > 0
        ? (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%"
        : "—",
    status: changePercent >= 0 ? "up" : "down",
    source: "Finnhub",
  };
}

async function getFredLatest(seriesId: string, label: string) {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=30";

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const observations = (data.observations || []).filter((x: any) => {
    const n = Number(x.value);
    return x.value !== "." && Number.isFinite(n);
  });

  const latest = Number(observations[0]?.value);
  const previous = Number(observations[1]?.value);

  const changePercent =
    previous > 0 ? ((latest - previous) / previous) * 100 : 0;

  return {
    label,
    value: Number.isFinite(latest) ? latest.toFixed(2) : "—",
    chg: Number.isFinite(changePercent)
      ? (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%"
      : "—",
    status: changePercent >= 0 ? "up" : "down",
    source: "FRED",
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
