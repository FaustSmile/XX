import { NextResponse } from "next/server";

const FRED_API_KEY = process.env.FRED_API_KEY;

async function getFredSeries(seriesId: string) {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    seriesId +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=24";

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  return (data.observations || []).filter((x: any) => x.value !== ".");
}

function pctYoY(latest: number, yearAgo: number) {
  return ((latest - yearAgo) / yearAgo) * 100;
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

  const [cpi, pce, nfp, fedFunds] = await Promise.all([
    getFredSeries("CPIAUCSL"),
    getFredSeries("PCEPI"),
    getFredSeries("PAYEMS"),
    getFredSeries("FEDFUNDS"),
  ]);

  const cpiLatest = Number(cpi[0]?.value);
  const cpiYearAgo = Number(cpi[12]?.value);
  const cpiPrev = Number(cpi[1]?.value);

  const pceLatest = Number(pce[0]?.value);
  const pceYearAgo = Number(pce[12]?.value);
  const pcePrev = Number(pce[1]?.value);

  const nfpLatest = Number(nfp[0]?.value);
  const nfpPrev = Number(nfp[1]?.value);
  const nfpChange = nfpLatest - nfpPrev;

  const fedLatest = Number(fedFunds[0]?.value);
  const fedPrev = Number(fedFunds[1]?.value);

  return NextResponse.json([
    {
      name: "CPI",
      actual: isFinite(cpiLatest) && isFinite(cpiYearAgo)
        ? pctYoY(cpiLatest, cpiYearAgo).toFixed(2) + "%"
        : "等待資料",
      forecast: "—",
      previous: isFinite(cpiPrev) && isFinite(cpi[13]?.value)
        ? pctYoY(cpiPrev, Number(cpi[13].value)).toFixed(2) + "%"
        : "—",
      time: "最新月份：" + (cpi[0]?.date || "—"),
      impact: "高",
      updated: true,
    },
    {
      name: "PCE",
      actual: isFinite(pceLatest) && isFinite(pceYearAgo)
        ? pctYoY(pceLatest, pceYearAgo).toFixed(2) + "%"
        : "等待資料",
      forecast: "—",
      previous: isFinite(pcePrev) && isFinite(pce[13]?.value)
        ? pctYoY(pcePrev, Number(pce[13].value)).toFixed(2) + "%"
        : "—",
      time: "最新月份：" + (pce[0]?.date || "—"),
      impact: "高",
      updated: true,
    },
    {
      name: "非農 NFP",
      actual: isFinite(nfpChange)
        ? nfpChange.toFixed(0) + "K"
        : "等待資料",
      forecast: "—",
      previous: "上月總量：" + (isFinite(nfpPrev) ? nfpPrev.toFixed(0) + "K" : "—"),
      time: "最新月份：" + (nfp[0]?.date || "—"),
      impact: "高",
      updated: true,
    },
    {
      name: "FOMC / 利率",
      actual: isFinite(fedLatest) ? fedLatest.toFixed(2) + "%" : "等待資料",
      forecast: "—",
      previous: isFinite(fedPrev) ? fedPrev.toFixed(2) + "%" : "—",
      time: "最新月份：" + (fedFunds[0]?.date || "—"),
      impact: "極高",
      updated: true,
    },
  ]);
}
