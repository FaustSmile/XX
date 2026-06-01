import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
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

    const valueMatch = html.match(/Latest GDPNow Estimate.*?(-?\d+\.\d+)%/is);

    const quarterMatch = html.match(
      /Latest GDPNow Estimate for ([0-9]{4}:[Qq][1-4])/is
    );

    const updatedMatch = html.match(
      /Updated:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/is
    );

    const nextMatch = html.match(
      /Next update:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/is
    );

    const actual = valueMatch?.[1]
      ? valueMatch[1] + "%"
      : "—";

    const quarter = quarterMatch?.[1]
      ? clean(quarterMatch[1])
      : "—";

    const updated = updatedMatch?.[1]
      ? clean(updatedMatch[1])
      : "";

    const nextUpdate = nextMatch?.[1]
      ? clean(nextMatch[1])
      : "";

    return NextResponse.json({
      id: "GDPNOW",
      name: "GDPNow 預測",
      group: "經濟成長",
      actual,
      previous: "預測季度：" + quarter,
      unit: "",
      impact: "高",
      time:
        updated || nextUpdate
          ? `更新：${updated}｜下次：${nextUpdate}`
          : "Atlanta Fed GDPNow",
      source: "Atlanta Fed",
    });
  } catch (e) {
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
