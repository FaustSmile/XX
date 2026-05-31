import { NextResponse } from "next/server";

const FRED_API_KEY = process.env.FRED_API_KEY;

async function getFredSeries(seriesId: string) {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=24";

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  return (data.observations || []).filter(
    (x: any) => x.value !== "." && x.value !== null
  );
}

function pctYoY(latest: number, yearAgo: number) {
  return ((latest - yearAgo) / yearAgo) * 100;
}

function safePercent(value: number) {
  return isFinite(value) ? value.toFixed(2) + "%" : "等待資料";
}

export async function GET() {
  if (!FRED_API_KEY) {
    return NextResponse.json([
      {
        name: "CPI",
        actual: "尚未設定 FRED_API_KEY",
        forecast: "—",
        previous: "—",
        time: "請到 Vercel 設定環境變數",
        impact: "高",
        updated: false,
      },
    ]);
  }

  try {
    const cpi = await getFredSeries("CPIAUCSL");
    const pce = await getFredSeries("PCEPI");
    const nfp = await getFredSeries("PAYEMS");
    const fedFunds = await getFredSeries("FEDFUNDS");

    const cpiActual = pctYoY(Number(cpi[0]?.value), Number(cpi[12]?.value));
    const cpiPrevious = pctYoY(Number(cpi[1]?.value), Number(cpi[13]?.value));

    const pceActual = pctYoY(Number(pce[0]?.value), Number(pce[12]?.value));
    const pcePrevious = pctYoY(Number(pce[1]?.value), Number(pce[13]?.value));

    const nfpLatest = Number(nfp[0]?.value);
    const nfpPrevious = Number(nfp[1]?.value);
    const nfpChange = nfpLatest - nfpPrevious;

    const fedLatest = Number(fedFunds[0]?.value);
    const fedPrevious = Number(fedFunds[1]?.value);

    return NextResponse.json([
      {
        name: "CPI",
        actual: safePercent(cpiActual),
        forecast: "—",
        previous: safePercent(cpiPrevious),
        time: "最新月份：" + (cpi[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "PCE",
        actual: safePercent(pceActual),
        forecast: "—",
        previous: safePercent(pcePrevious),
        time: "最新月份：" + (pce[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "非農 NFP",
        actual: isFinite(nfpChange) ? nfpChange.toFixed(0) + "K" : "等待資料",
        forecast: "—",
        previous: isFinite(nfpPrevious) ? "上月總量：" + nfpPrevious.toFixed(0) + "K" : "—",
        time: "最新月份：" + (nfp[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "FOMC / 利率",
        actual: isFinite(fedLatest) ? fedLatest.toFixed(2) + "%" : "等待資料",
        forecast: "—",
        previous: isFinite(fedPrevious) ? fedPrevious.toFixed(2) + "%" : "—",
        time: "最新月份：" + (fedFunds[0]?.date || "—"),
        impact: "極高",
        updated: true,
      },
    ]);
  } catch (error) {
    return NextResponse.json([
      {
        name: "資料讀取錯誤",
        actual: "請檢查 FRED_API_KEY",
        forecast: "—",
        previous: "—",
        time: "FRED API 讀取失敗",
        impact: "高",
        updated: false,
      },
    ]);
  }
}
