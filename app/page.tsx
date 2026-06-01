'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Database,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const demoMarketCards = [
  { label: 'SPY', value: '等待資料', chg: '—', status: 'up', source: '等待同步' },
  { label: 'QQQ', value: '等待資料', chg: '—', status: 'up', source: '等待同步' },
  { label: 'VIX', value: '等待資料', chg: '—', status: 'down', source: '等待同步' },
  { label: '10Y', value: '等待資料', chg: '—', status: 'down', source: '等待同步' },
  { label: 'DXY', value: '等待資料', chg: '—', status: 'down', source: '等待同步' },
  { label: 'WTI', value: '等待資料', chg: '—', status: 'up', source: '等待同步' },
]

type MacroItem = {
  id: string
  name: string
  group: string
  actual: string
  previous: string
  unit: string
  impact: string
  time: string
  source: string
}

async function safeFetch(endpoint: string, fallback: any) {
  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (!res.ok) throw new Error('API not ready')
    return await res.json()
  } catch {
    return fallback
  }
}

function Pill({ children, tone = 'gold' }: { children: React.ReactNode; tone?: string }) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : tone === 'red'
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : tone === 'blue'
      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
      : 'bg-[#C8A96B]/15 text-[#E6C77D] border-[#C8A96B]/30'

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>
      {children}
    </span>
  )
}

function formatNow() {
  return new Date().toLocaleString('zh-TW', { hour12: false })
}

function isValidMarketData(data: any) {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((item) => item?.value && item?.source && item.source !== 'Demo')
  )
}

function groupMacro(items: MacroItem[]) {
  return items.reduce<Record<string, MacroItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})
}

export default function DeepResearchDashboard() {
  const [updatedAt, setUpdatedAt] = useState('尚未刷新')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [marketCards, setMarketCards] = useState(demoMarketCards)
  const [macroItems, setMacroItems] = useState<MacroItem[]>([])
  const [latestAlert, setLatestAlert] = useState({
    title: '等待初始化',
    detail: '系統正在同步市場與總經資料。',
    updated: false,
  })

  const grouped = useMemo(() => groupMacro(macroItems), [macroItems])

  async function refreshMarket() {
    setLoading(true)

    const market = await safeFetch('/api/market', null)
    const marketOk = isValidMarketData(market)

    if (marketOk) {
      setMarketCards(market)
      setConnected(true)
    }

    setUpdatedAt(formatNow())
    setLatestAlert({
      title: marketOk ? '市場報價已更新' : '市場報價本次未取得新資料',
      detail: '總經資料不會因市場刷新而重新抓取，會保留最近一次成功同步結果。',
      updated: marketOk,
    })

    setLoading(false)
  }

  async function initData() {
    setLoading(true)

    const [market, macro] = await Promise.all([
      safeFetch('/api/market', null),
      safeFetch('/api/macro', null),
    ])

    const marketOk = isValidMarketData(market)
    const macroOk = Array.isArray(macro?.items) && macro.items.length > 0

    if (marketOk) setMarketCards(market)
    if (macroOk) setMacroItems(macro.items)

    setConnected(marketOk || macroOk)
    setUpdatedAt(formatNow())
    setLatestAlert({
      title: macroOk ? '總經資料已同步' : '總經資料部分同步',
      detail: macroOk ? '已載入流動性、利率、通膨與就業資料。' : '請確認 /api/macro 是否正常。',
      updated: true,
    })

    setLoading(false)
  }

  useEffect(() => {
    initData()

    const timer = setInterval(() => {
      refreshMarket()
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const groupOrder = ['經濟成長', '流動性', '利率', '通膨', '就業']

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
              總經深度研究儀表板
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              追蹤 SPY、QQQ、VIX、10Y、DXY、WTI，以及流動性、利率、通膨與就業數據。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={connected ? 'green' : 'red'}>
              {connected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {connected ? '資料已串接' : '等待更新'}
            </Pill>

            <Button
              onClick={refreshMarket}
              disabled={loading}
              className="rounded-2xl bg-[#C8A96B] text-black hover:bg-[#E6C77D]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '更新中' : '刷新市場'}
            </Button>
          </div>
        </motion.div>

        <Card className="rounded-3xl border-[#C8A96B]/20 bg-gradient-to-r from-[#161616] to-[#0D0D0D]">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#E6C77D]" />
                <span className="font-semibold text-[#E6C77D]">最新數據提醒欄位</span>
                {latestAlert.updated && <Pill tone="green">NEW</Pill>}
              </div>

              <div className="text-lg font-semibold">{latestAlert.title}</div>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{latestAlert.detail}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
              <div className="flex items-center gap-2 text-[#C8A96B]">
                <Database className="h-4 w-4" />
                資料更新狀態
              </div>

              <div className="mt-2">最後更新：{updatedAt}</div>
              <div className="mt-1">市場報價：每 60 秒</div>
              <div className="mt-1">總經資料：重新開啟網頁時同步</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-6">
          {marketCards.map((m) => (
            <Card key={m.label} className="rounded-3xl border-white/10 bg-[#161616] shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>{m.label}</span>

                  {m.status === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-300" />
                  )}
                </div>

                <div className="mt-3 text-2xl font-semibold">{m.value}</div>

                <div className={m.status === 'up' ? 'text-sm text-emerald-300' : 'text-sm text-red-300'}>
                  {m.chg}
                </div>

                <div className="mt-2 text-[10px] text-zinc-600">Source: {m.source || 'API'}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616] lg:col-span-2">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Database className="text-[#C8A96B]" />
                  總經與流動性數據
                </div>

                <Pill tone="blue">FRED</Pill>
              </div>

              {macroItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0D0D0D] p-6 text-zinc-400">
                  尚未取得總經資料，請確認 /api/macro 是否成功回傳資料。
                </div>
              ) : (
                <div className="space-y-8">
                  {groupOrder.map((group) => {
                    const list = grouped[group] || []
                    if (list.length === 0) return null

                    return (
                      <div key={group}>
                        <div className="mb-3 text-sm font-semibold text-[#E6C77D]">{group}</div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {list.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0D0D0D] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium leading-5">{item.name}</span>
          
                              </div>

                              <div className="mt-3 text-2xl font-semibold text-white">
                                {item.actual}
                                {item.unit ? (
                                  <span className="ml-1 text-sm text-zinc-500">{item.unit}</span>
                                ) : null}
                              </div>

                              <div className="mt-2 text-xs text-zinc-500">Previous：{item.previous}</div>
                              <div className="pt-2 text-xs text-zinc-500">{item.time}</div>
                              <div className="pt-1 text-[10px] text-zinc-700">Source：{item.source}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Database className="text-[#C8A96B]" />
                外部總經資訊
              </div>

              <div className="grid gap-3">
                <ExternalLinkCard title="Fear & Greed Index" desc="CNN 市場情緒指數" href="https://edition.cnn.com/markets/fear-and-greed" />
                <ExternalLinkCard title="FedWatch Tool" desc="聯準會利率機率" href="https://www.cmegroup.com/cn-t/markets/interest-rates/cme-fedwatch-tool.html" />
                <ExternalLinkCard title="美國 GDP" desc="美國官方 GDP 數據" href="https://www.bea.gov/" />
                <ExternalLinkCard title="美國 TGA" desc="Treasury General Account" href="https://fred.stlouisfed.org/series/D2WLTGAL" />
                <ExternalLinkCard title="銀行準備金" desc="Fed Reserve Balances" href="https://fred.stlouisfed.org/release?rid=20" />
                <ExternalLinkCard title="非農就業 NFP" desc="美國非農數據" href="https://hk.investing.com/economic-calendar/nonfarm-payrolls-227" />
                <ExternalLinkCard title="美國失業率" desc="Unemployment Rate" href="https://hk.investing.com/economic-calendar/unemployment-rate-300" />
                <ExternalLinkCard title="美國 CPI" desc="消費者物價指數" href="https://hk.investing.com/economic-calendar/cpi-733/" />
                <ExternalLinkCard title="美國核心 CPI" desc="Core CPI" href="https://hk.investing.com/economic-calendar/core-cpi-736" />
                <ExternalLinkCard title="美國核心 PCE" desc="Core PCE" href="https://hk.investing.com/economic-calendar/core-pce-price-index-905" />
                <ExternalLinkCard title="美國核心 PPI" desc="Producer Price Index" href="https://hk.investing.com/economic-calendar/core-ppi-735" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ExternalLinkCard({
  title,
  desc,
  href,
}: {
  title: string
  desc: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#C8A96B]/40 hover:bg-black/40"
    >
      <div className="font-semibold text-[#E6C77D]">{title}</div>
      <div className="mt-1 text-sm text-zinc-400">{desc}</div>
    </a>
  )
}
