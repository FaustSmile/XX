import { NextResponse } from "next/server";

const API_KEY = process.env.FINNHUB_API_KEY;

type MacroItem = {
  name: string;
  actual: string;
  forecast: string;
  previous: string;
  time: string;
  impact: string;
  updated: boolean;
};

function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function findEvent(events: any[], keywords: string[]) {
  return events.find((event) => {
    const name = String(event.event || event.name || "").toLowerCase();
    return keywords.some((k) => name.includes(k.toLowerCase()));
  });
}

function buildItem(
  displayName: string,
  pastEvents: any[],
  futureEvents: any[],
  keywords: string[],
  impact: string
): MacroItem {
  const latest = findEvent(pastEvents, keywords);
  const next = findEvent(futureEvents, keywords);

  return {
    name: displayName,
    actual: latest ? formatValue(latest.actual) : "等待資料",
    forecast: latest ? formatValue(latest.estimate) : "—",
    previous: latest ? formatValue(latest.prev) : "—",
    time: next
      ? "下次公布：" + (next.date || next.time || "依經濟日曆")
      : "下次公布：依經濟日曆",
    impact,
    updated: Boolean(latest?.actual),
  };
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json([
      {
        name: "CPI",
        actual: "尚未設定 API Key",
        forecast: "—",
        previous: "—",
        time: "請先設定 FINNHUB_API_KEY",
        impact: "高",
        updated: false,
      },
    ]);
  }

  const today = new Date();

  const past = new Date(today);
  past.setDate(today.getDate() - 120);

  const future = new Date(today);
  future.setDate(today.getDate() + 120);

  const pastStr = past.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  const pastUrl =
    "https://finnhub.io/api/v1/calendar/economic?from=" +
    pastStr +
    "&to=" +
    todayStr +
    "&token=" +
    API_KEY;

  const futureUrl =
    "https://finnhub.io/api/v1/calendar/economic?from=" +
    todayStr +
    "&to=" +
    futureStr +
    "&token=" +
    API_KEY;

  const [pastRes, futureRes] = await Promise.all([
    fetch(pastUrl, { cache: "no-store" }),
    fetch(futureUrl, { cache: "no-store" }),
  ]);

  const pastData = await pastRes.json();
  const futureData = await futureRes.json();

  const pastEvents = (pastData.economicCalendar || []).reverse();
  const futureEvents = futureData.economicCalendar || [];

  const result = [
    buildItem(
      "CPI",
      pastEvents,
      futureEvents,
      ["Consumer Price Index", "CPI"],
      "高"
    ),
    buildItem(
      "PCE",
      pastEvents,
      futureEvents,
      ["PCE Price Index", "Personal Consumption"],
      "高"
    ),
    buildItem(
      "非農 NFP",
      pastEvents,
      futureEvents,
      ["Nonfarm Payrolls", "Non Farm Payrolls", "NFP"],
      "高"
    ),
    buildItem(
      "FOMC",
      pastEvents,
      futureEvents,
      ["FOMC", "Fed Interest Rate Decision", "Federal Reserve"],
      "極高"
    ),
  ];

  return NextResponse.json(result);
}
