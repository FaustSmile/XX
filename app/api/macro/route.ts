import { NextResponse } from "next/server";

const FRED_API_KEY = process.env.FRED_API_KEY;

type FredObservation = {
  date: string;
  value: string;
};

async function getFredSeries(seriesId: string): Promise<FredObservation[]> {
  const url =
    "https://api.stlouisfed.org/fred/series/observations?series_id=" +
    encodeURIComponent(seriesId) +
    "&api_key=" +
    FRED_API_KEY +
    "&file_type=json&sort_order=desc&limit=60";

  const res = await fetch(url, {
    cache: "no-store",
  });

  const data = await res.json();

  const observations = data.observations || [];

  return observations.filter((x: FredObservation) => {
    const value = Number(x.value);

    return (
      x.value !== "." &&
      x.value !== null &&
      x.value !== undefined &&
      !Number.isNaN(value) &&
      Number.isFinite(value)
    );
  });
}

function pctYoY(latest: number, yearAgo: number) {
  return ((latest - yearAgo) / yearAgo) * 100;
}

function safePercent(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) + "%" : "等待資料";
}

function safeNumber(value: string | undefined) {
  const num = Number(value);

  return Number.isFinite(num) ? num : NaN;
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
    const [cpi, pce, nfp, fedFunds] = await Promise.all([
      getFredSeries("CPIAUCSL"),
      getFredSeries("PCEPI"),
      getFredSeries("PAYEMS"),
      getFredSeries("FEDFUNDS"),
    ]);

    const cpiLatest = safeNumber(cpi[0]?.value);
    const cpiYearAgo = safeNumber(cpi[12]?.value);
    const cpiPrevious = safeNumber(cpi[1]?.value);
    const cpiPreviousYearAgo = safeNumber(cpi[13]?.value);

    const pceLatest = safeNumber(pce[0]?.value);
    const pceYearAgo = safeNumber(pce[12]?.value);
    const pcePrevious = safeNumber(pce[1]?.value);
    const pcePreviousYearAgo = safeNumber(pce[13]?.value);

    const nfpLatest = safeNumber(nfp[0]?.value);
    const nfpPrevious = safeNumber(nfp[1]?.value);
    const nfpChange = nfpLatest - nfpPrevious;

    const fedLatest = safeNumber(fedFunds[0]?.value);
    const fedPrevious = safeNumber(fedFunds[1]?.value);

    return NextResponse.json([
      {
        name: "CPI",
        actual:
          Number.isFinite(cpiLatest) && Number.isFinite(cpiYearAgo)
            ? safePercent(pctYoY(cpiLatest, cpiYearAgo))
            : "等待資料",
        forecast: "—",
        previous:
          Number.isFinite(cpiPrevious) &&
          Number.isFinite(cpiPreviousYearAgo)
            ? safePercent(pctYoY(cpiPrevious, cpiPreviousYearAgo))
            : "—",
        time: "最新月份：" + (cpi[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "PCE",
        actual:
          Number.isFinite(pceLatest) && Number.isFinite(pceYearAgo)
            ? safePercent(pctYoY(pceLatest, pceYearAgo))
            : "等待資料",
        forecast: "—",
        previous:
          Number.isFinite(pcePrevious) &&
          Number.isFinite(pcePreviousYearAgo)
            ? safePercent(pctYoY(pcePrevious, pcePreviousYearAgo))
            : "—",
        time: "最新月份：" + (pce[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "非農 NFP",
        actual: Number.isFinite(nfpChange)
          ? nfpChange.toFixed(0) + "K"
          : "等待資料",
        forecast: "—",
        previous: Number.isFinite(nfpPrevious)
          ? "上月總量：" + nfpPrevious.toFixed(0) + "K"
          : "—",
        time: "最新月份：" + (nfp[0]?.date || "—"),
        impact: "高",
        updated: true,
      },
      {
        name: "FOMC / 利率",
        actual: Number.isFinite(fedLatest)
          ? fedLatest.toFixed(2) + "%"
          : "等待資料",
        forecast: "—",
        previous: Number.isFinite(fedPrevious)
          ? fedPrevious.toFixed(2) + "%"
          : "—",
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
