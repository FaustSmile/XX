```ts
import { NextResponse } from "next/server";

const API_KEY = process.env.FINNHUB_API_KEY;

async function getQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  const current = data.c;
  const previous = data.pc;

  const changePercent =
    previous > 0
      ? ((current - previous) / previous) * 100
      : 0;

  return {
    label: symbol,
    value: current?.toFixed(2),
    chg: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
    status: changePercent >= 0 ? "up" : "down",
    source: "Finnhub",
  };
}

export async function GET() {
  const symbols = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA"];

  const results = await Promise.all(
    symbols.map((symbol) => getQuote(symbol))
  );

  return NextResponse.json(results);
}
```
