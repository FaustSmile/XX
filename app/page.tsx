"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MarketItem = {
  symbol: string;
  price: number;
  changePercent: number;
};

type MacroItem = {
  id: string;
  name: string;
  actual: string;
  previous: string;
  impact: string;
  group: string;
  time: string;
  source: string;
};

export default function Page() {
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [macro, setMacro] = useState<MacroItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMarket() {
    try {
      const res = await fetch("/api/market");

      const data = await res.json();

      if (data.items) {
        setMarket(data.items);
      }
    } catch {}
  }

  async function loadMacro() {
    try {
      const res = await fetch("/api/macro");

      const data = await res.json();

      if (data.items) {
        setMacro(data.items);
      }
    } catch {}
  }

  async function refreshMarket() {
    setLoading(true);

    await loadMarket();

    setLoading(false);
  }

  useEffect(() => {
    loadMarket();
    loadMacro();
  }, []);

  const macroGroups = useMemo(() => {
    return {
      inflation: macro.filter((x) => x.group === "通膨"),
      jobs: macro.filter((x) => x.group === "就業"),
      growth: macro.filter((x) => x.group === "經濟成長"),
      liquidity: macro.filter((x) => x.group === "流動性"),
      rates: macro.filter((x) => x.group === "利率"),
    };
  }, [macro]);

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-[1600px]">

        {/* 標題 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#E6C77D]">
              總經儀表板
            </h1>

            <p className="mt-2 text-zinc-400">
              市場 / 流動性 / 通膨 / 利率 / 就業
            </p>
          </div>

          <Button
            onClick={refreshMarket}
            disabled={loading}
            className="rounded-2xl bg-[#C8A96B] text-black hover:bg-[#E6C77D]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            {loading ? "更新中" : "刷新市場"}
          </Button>
        </div>

        {/* 市場數據 */}
        <div className="mb-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {market.map((item) => {
            const positive = item.changePercent >= 0;

            return (
              <motion.div
                key={item.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-3xl border border-white/10 bg-[#111111]">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-xl font-semibold">
                        {item.symbol}
                      </div>

                      {positive ? (
                        <TrendingUp className="text-emerald-400" />
                      ) : (
                        <TrendingDown className="text-red-400" />
                      )}
                    </div>

                    <div className="text-4xl font-bold">
                      {item.price}
                    </div>

                    <div
                      className={`mt-2 text-lg ${
                        positive
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {item.changePercent.toFixed(2)}%
                    </div>

                    <div className="mt-4 text-sm text-zinc-500">
                      Source: Finnhub 最新價
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* 主區塊 */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_420px]">

          {/* 左邊 */}
          <div className="space-y-6">

            {/* 總經與流動性 */}
            <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-2xl font-bold text-[#E6C77D]">
                    <Database />
                    總經與流動性數據
                  </div>

                  <div className="rounded-full bg-sky-500/20 px-4 py-1 text-sm text-sky-300">
                    FRED
                  </div>
                </div>

                {/* 經濟成長 */}
                <div className="mb-8">
                  <div className="mb-4 text-xl font-bold text-[#E6C77D]">
                    經濟成長
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {macroGroups.growth.map((item) => (
                      <MacroCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* 流動性 */}
                <div className="mb-8">
                  <div className="mb-4 text-xl font-bold text-[#E6C77D]">
                    流動性
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {macroGroups.liquidity.map((item) => (
                      <MacroCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* 利率 */}
                <div className="mb-8">
                  <div className="mb-4 text-xl font-bold text-[#E6C77D]">
                    利率
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {macroGroups.rates.map((item) => (
                      <MacroCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* 通膨 */}
                <div className="mb-8">
                  <div className="mb-4 text-xl font-bold text-[#E6C77D]">
                    通膨
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {macroGroups.inflation.map((item) => (
                      <MacroCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* 就業 */}
                <div>
                  <div className="mb-4 text-xl font-bold text-[#E6C77D]">
                    就業
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {macroGroups.jobs.map((item) => (
                      <MacroCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右邊外部資訊 */}
          <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Database className="text-[#C8A96B]" />
                外部總經資訊
              </div>

              <div className="grid gap-3">

                <ExternalLinkCard
                  title="Fear & Greed Index"
                  desc="CNN 市場情緒指數"
                  href="https://edition.cnn.com/markets/fear-and-greed"
                />

                <ExternalLinkCard
                  title="FedWatch Tool"
                  desc="聯準會利率機率"
                  href="https://www.cmegroup.com/cn-t/markets/interest-rates/cme-fedwatch-tool.html"
                />

                <ExternalLinkCard
                  title="美國 GDP"
                  desc="美國官方 GDP 數據"
                  href="https://www.bea.gov/"
                />

                <ExternalLinkCard
                  title="美國 TGA"
                  desc="Treasury General Account"
                  href="https://fred.stlouisfed.org/series/D2WLTGAL"
                />

                <ExternalLinkCard
                  title="銀行準備金"
                  desc="Fed Reserve Balances"
                  href="https://fred.stlouisfed.org/release?rid=20"
                />

                <ExternalLinkCard
                  title="非農就業 NFP"
                  desc="美國非農數據"
                  href="https://hk.investing.com/economic-calendar/nonfarm-payrolls-227"
                />

                <ExternalLinkCard
                  title="美國失業率"
                  desc="Unemployment Rate"
                  href="https://hk.investing.com/economic-calendar/unemployment-rate-300"
                />

                <ExternalLinkCard
                  title="美國 CPI"
                  desc="消費者物價指數"
                  href="https://hk.investing.com/economic-calendar/cpi-733/"
                />

                <ExternalLinkCard
                  title="美國核心 CPI"
                  desc="Core CPI"
                  href="https://hk.investing.com/economic-calendar/core-cpi-736"
                />

                <ExternalLinkCard
                  title="美國核心 PCE"
                  desc="Core PCE"
                  href="https://hk.investing.com/economic-calendar/core-pce-price-index-905"
                />

                <ExternalLinkCard
                  title="美國核心 PPI"
                  desc="Producer Price Index"
                  href="https://hk.investing.com/economic-calendar/core-ppi-735"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function MacroCard({ item }: { item: MacroItem }) {
  return (
    <Card className="rounded-3xl border border-white/10 bg-black">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-2xl">
            {item.name}
          </div>

          <div className="rounded-full border border-[#C8A96B]/30 bg-[#C8A96B]/10 px-3 py-1 text-sm text-[#E6C77D]">
            {item.impact}
          </div>
        </div>

        <div className="text-5xl font-bold">
          {item.actual}
        </div>

        <div className="mt-4 text-lg text-zinc-400">
          Previous : {item.previous}
        </div>

        <div className="mt-3 text-lg text-zinc-500">
          {item.time}
        </div>

        <div className="mt-3 text-sm text-zinc-600">
          Source : {item.source}
        </div>
      </CardContent>
    </Card>
  );
}

function ExternalLinkCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#C8A96B]/40"
    >
      <div className="font-semibold text-[#E6C77D]">
        {title}
      </div>

      <div className="mt-1 text-sm text-zinc-400">
        {desc}
      </div>
    </a>
  );
}
