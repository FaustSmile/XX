```tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Database,
  Gauge,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const demoMarketCards = [
  { label: 'SPY', value: '638.42', chg: '+0.42%', status: 'up', source: 'Demo' },
  { label: 'QQQ', value: '571.20', chg: '+0.68%', status: 'up', source: 'Demo' },
  { label: 'VIX', value: '14.8', chg: '-3.1%', status: 'down', source: 'Demo' },
  { label: 'DXY', value: '98.7', chg: '-0.18%', status: 'down', source: 'Demo' },
  { label: '10Y', value: '4.12%', chg: '-0.05', status: 'down', source: 'Demo' },
  { label: 'BTC', value: '102,480', chg: '+1.9%', status: 'up', source: 'Demo' },
]

const demoMacroEvents = [
  {
    name: 'CPI',
    actual: '等待資料',
    forecast: '—',
    previous: '—',
    time: '等待首次同步',
    impact: '高',
    updated: false,
  },
  {
    name: 'PCE',
    actual: '等待資料',
    forecast: '—',
    previous: '—',
    time: '等待首次同步',
    impact: '高',
    updated: false,
  },
  {
    name: '非農 NFP',
    actual: '等待資料',
    forecast: '—',
    previous: '—',
    time: '等待首次同步',
    impact: '高',
    updated: false,
  },
  {
    name: 'FOMC / 利率',
    actual: '等待資料',
    forecast: '—',
    previous: '—',
    time: '等待首次同步',
    impact: '極高',
    updated: false,
  },
]

async function safeFetch(endpoint: string, fallback: any) {
  try {
    const res = await fetch(endpoint, {
      cache: 'no-store',
    })

    if (!res.ok) throw new Error('API not ready')

    return await res.json()
  } catch (error) {
    return fallback
  }
}

function Pill({
  children,
  tone = 'gold',
}: {
  children: React.ReactNode
  tone?: string
}) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : tone === 'red'
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : tone === 'blue'
      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
      : 'bg-[#C8A96B]/15 text-[#E6C77D] border-[#C8A96B]/30'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}
    >
      {children}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-emerald-300'
      : score >= 60
      ? 'text-[#E6C77D]'
      : 'text-red-300'

  return (
    <div className="flex items-center justify-center">
      <div className="relative grid h-36 w-36 place-items-center rounded-full border border-[#C8A96B]/30 bg-black/30 shadow-[0_0_35px_rgba(200,169,107,0.14)]">
        <div className="absolute inset-3 rounded-full border border-white/10" />

        <div className="text-center">
          <div className={`text-4xl font-semibold ${color}`}>
            {score}
          </div>

          <div className="text-xs text-zinc-400">/ 100</div>
        </div>
      </div>
    </div>
  )
}

function getStatusTone(score: number) {
  if (score >= 80) return 'green'
  if (score >= 60) return 'gold'
  return 'red'
}

function formatNow() {
  return new Date().toLocaleString('zh-TW', {
    hour12: false,
  })
}

function isInvalidValue(value: any) {
  const text = String(value || '').trim()

  return (
    text === '' ||
    text === '—' ||
    text === '-' ||
    text === '等待資料'
  )
}

function isValidMarketData(data: any) {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.some(
      (item) =>
        item?.value &&
        item?.source &&
        item.source !== 'Demo'
    )
  )
}

function isValidMacroData(data: any) {
  if (!Array.isArray(data) || data.length === 0) {
    return false
  }

  const validCount = data.filter(
    (item) => !isInvalidValue(item?.actual)
  ).length

  return validCount >= 2
}

export default function DeepResearchDashboard() {
  const [updatedAt, setUpdatedAt] = useState('尚未刷新')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const [marketCards, setMarketCards] =
    useState(demoMarketCards)

  const [macroEvents, setMacroEvents] =
    useState(demoMacroEvents)

  const [latestAlert, setLatestAlert] = useState({
    title: '等待初始化',
    detail:
      '系統正在等待首次同步市場與總經資料。',
    updated: false,
  })

  const buyCallScore = useMemo(() => {
    const qqqStrong =
      marketCards.find((m) => m.label === 'QQQ')?.status ===
      'up'
        ? 18
        : 10

    const spyStrong =
      marketCards.find((m) => m.label === 'SPY')?.status ===
      'up'
        ? 15
        : 8

    const vixOk =
      marketCards.find((m) => m.label === 'VIX')?.status ===
      'down'
        ? 18
        : 8

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(qqqStrong + spyStrong + vixOk + 35)
      )
    )
  }, [marketCards])

  const marketStatus =
    buyCallScore >= 80
      ? 'Risk On'
      : buyCallScore >= 60
      ? 'Neutral'
      : 'Risk Off'

  const statusTone = getStatusTone(buyCallScore)

  async function refreshData(fetchMacro = false) {
    setLoading(true)

    const market = await safeFetch('/api/market', null)

    const marketOk = isValidMarketData(market)

    if (marketOk) {
      setMarketCards(market)
    }

    let macroOk = false

    if (fetchMacro) {
      const macro = await safeFetch('/api/macro', null)

      macroOk = isValidMacroData(macro)

      if (macroOk) {
        setMacroEvents(macro)
      }
    }

    setConnected(marketOk || macroOk)

    setUpdatedAt(formatNow())

    setLatestAlert({
      title: fetchMacro
        ? '市場與高影響經濟數據已初始化'
        : '市場報價已更新',
      detail: fetchMacro
        ? '高影響經濟數據只會在首次開啟網頁時同步。'
        : '目前僅刷新市場報價，高影響經濟數據維持首次同步資料。',
      updated: true,
    })

    setLoading(false)
  }

  useEffect(() => {

    // 第一次開網頁
    refreshData(true)

    // 每60秒只刷新市場報價
    const timer = setInterval(() => {
      refreshData(false)
    }, 60000)

    return () => clearInterval(timer)

  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 text-[#F3F1EC] md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#C8A96B]">
              <Sparkles size={16} />
              深度研究系統
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              深度研究儀表板
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              整合總經、流動性與市場情緒，
              用來判斷今天是否適合進攻 Buy Call。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={connected ? 'green' : 'red'}>
              {connected ? (
                <Wifi className="mr-1 h-3 w-3" />
              ) : (
                <WifiOff className="mr-1 h-3 w-3" />
              )}

              {connected ? '即時串接' : '等待更新'}
            </Pill>

            <Pill tone={statusTone}>
              {statusTone === 'green'
                ? '🟢'
                : statusTone === 'red'
                ? '🔴'
                : '🟡'}{' '}
              {marketStatus}
            </Pill>

            <Button
              onClick={() => refreshData(false)}
              disabled={loading}
              className="rounded-2xl bg-[#C8A96B] text-black hover:bg-[#E6C77D]"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />

              {loading ? '更新中' : '刷新市場'}
            </Button>
          </div>
        </motion.div>

        <Card className="rounded-3xl border-[#C8A96B]/20 bg-gradient-to-r from-[#161616] to-[#0D0D0D]">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3 md:items-center">

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#E6C77D]" />

                <span className="font-semibold text-[#E6C77D]">
                  最新數據提醒欄位
                </span>

                {latestAlert.updated && (
                  <Pill tone="green">NEW</Pill>
                )}
              </div>

              <div className="text-lg font-semibold">
                {latestAlert.title}
              </div>

              <p className="mt-2 text-sm leading-7 text-zinc-300">
                {latestAlert.detail}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
              <div className="flex items-center gap-2 text-[#C8A96B]">
                <Database className="h-4 w-4" />
                資料更新狀態
              </div>

              <div className="mt-2">
                最後更新：{updatedAt}
              </div>

              <div className="mt-1">
                自動刷新：每 60 秒
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-6">
          {marketCards.map((m) => (
            <Card
              key={m.label}
              className="rounded-3xl border-white/10 bg-[#161616] shadow-xl"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>{m.label}</span>

                  {m.status === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-300" />
                  )}
                </div>

                <div className="mt-3 text-2xl font-semibold">
                  {m.value}
                </div>

                <div
                  className={
                    m.status === 'up'
                      ? 'text-sm text-emerald-300'
                      : 'text-sm text-red-300'
                  }
                >
                  {m.chg}
                </div>

                <div className="mt-2 text-[10px] text-zinc-600">
                  Source: {m.source || 'API'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616] lg:col-span-2">
            <CardContent className="p-6">

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CalendarClock className="text-[#C8A96B]" />
                  高影響經濟數據
                </div>

                <Pill tone="blue">
                  CPI / PCE / NFP / FOMC
                </Pill>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {macroEvents.map((e) => (
                  <div
                    key={e.name}
                    className="rounded-2xl border border-white/10 bg-[#0D0D0D] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {e.name}
                      </span>

                      <Pill>{e.impact}</Pill>
                    </div>

                    <div className="mt-3 space-y-1">

                      <div className="text-2xl font-semibold text-white">
                        {e.actual}
                      </div>

                      <div className="text-xs text-zinc-500">
                        Forecast：{e.forecast}
                      </div>

                      <div className="text-xs text-zinc-500">
                        Previous：{e.previous}
                      </div>

                      <div className="pt-2 text-sm text-zinc-500">
                        {e.time}
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616]">
            <CardContent className="p-6">

              <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Gauge className="text-[#C8A96B]" />
                Buy Call 環境評分
              </div>

              <ScoreRing score={buyCallScore} />

              <div
                className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${
                  statusTone === 'green'
                    ? 'bg-emerald-500/10 text-emerald-200'
                    : statusTone === 'red'
                    ? 'bg-red-500/10 text-red-200'
                    : 'bg-[#C8A96B]/10 text-[#E6C77D]'
                }`}
              >
                目前狀態：{marketStatus}
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}
```
