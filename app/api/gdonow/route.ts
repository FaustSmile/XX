import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function extractMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match ? match[1].trim() : "";
}

export async function GET() {
  try {
    const res = await fetch(
      "https://www.atlantafed.org/research-and-data/data/gdpnow",
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const html = await res.text();

    const value = extractMatch(html, /(\d+(?:\.\d+)?)%\s*Latest GDPNow Estimate/i);

    const quarter = extractMatch(
      html,
      /Latest GDPNow Estimate for\s*([0-9]{4}:Q[1-4])/i
    );

    const updated = extractMatch(
      html,
      /Updated:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
    );

    const nextUpdate = extractMatch(
      html,
      /Next update:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
    );

    return NextResponse.json({
      id: "GDPNOW",
      name: "GDPNow 預測",
      group: "經濟成長",
      actual: value ? value + "%" : "—",
      previous: quarter ? "預測季度：" + quarter : "—",
      unit: "",
      impact: "高",
      time: updated
        ? "更新：" + updated + (nextUpdate ? "｜下次：" + nextUpdate : "")
        : "Atlanta Fed GDPNow",
      source: "Atlanta Fed",
    });
  } catch {
    return NextResponse.json({
      id: "GDPNOW",
      name: "GDPNow 預測",
      group: "經濟成長",
      actual: "—",
      previous: "—",
      unit: "",
      impact: "高",
      time: "GDPNow 讀取失敗",
      source: "Atlanta Fed",
    });
  }
}
