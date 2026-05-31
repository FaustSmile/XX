'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, CalendarClock, CheckCircle2, Database, Gauge, LineChart, RefreshCw, Search, ShieldCheck, Sparkles, Wifi, WifiOff } from 'lucide-react'
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
  { name: 'CPI', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false },
  { name: 'FOMC', actual: '等待會議', forecast: '—', previous: '—', time: '下次會議：依 Fed 日曆', impact: '極高', updated: false },
  { name: '非農 NFP', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false },
  { name: 'PCE', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false },
]

const demoSectors = [
  { name: 'AI', strength: 92, note: 'NVDA / MSFT / AMD 強勢', updated: true },
  { name: 'BTC / 加密', strength: 78, note: 'COIN / MSTR 轉強', updated: true },
  { name: '核能', strength: 66, note: 'OKLO / SMR 觀察回踩', updated: false },
  { name: '資安', strength: 84, note: 'PANW / CRWD / ZS 延續', updated: true },
  { name: '稀土', strength: 58, note: 'MP / UUUU 等待突破', updated: false },
]

const demoWatchlist = [
  { ticker: 'NVDA', sector: 'AI', setup: 'EMA多頭｜回踩20日', score: 88, updated: true },
  { ticker: 'MSFT', sector: 'AI', setup: '突破整理｜相對強', score: 82, updated: true },
  { ticker: 'COIN', sector: 'BTC', setup: 'BTC Risk On｜量能轉強', score: 79, updated: true },
  { ticker: 'PANW', sector: '資安', setup: '財報後強勢｜站上40日', score: 76, updated: false },
  { ticker: 'OKLO', sector: '核能', setup: '題材強｜等右側確認', score: 69, updated: false },
]

const optionChecklist = [
  { item: 'DTE', value: '30–90天', pass: true },
  { item: 'Delta', value: '0.40–0.70', pass: true },
  { item: 'IV', value: '避免財報前追高', pass: false },
  { item: '進場', value: '突破 / 回踩確認', pass: true },
]

async function safeFetch(endpoint: string, fallback: any) {
  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (!res.ok) throw new Error('API not ready')
    return await res.json()
  } catch (error) { return fallback }
}

function Pill({ children, tone = 'gold' }: { children: React.ReactNode; tone?: string }) {
  const cls = tone === 'green' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : tone === 'red' ? 'bg-red-500/15 text-red-300 border-red-500/30' : tone === 'blue' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-[#C8A96B]/15 text-[#E6C77D] border-[#C8A96B]/30'
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>{children}</span>
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-300' : score >= 60 ? 'text-[#E6C77D]' : 'text-red-300'
  return <div className="flex items-center justify-center"><div className="relative grid h-36 w-36 place-items-center rounded-full border border-[#C8A96B]/30 bg-black/30 shadow-[0_0_35px_rgba(200,169,107,0.14)]"><div className="absolute inset-3 rounded-full border border-white/10" /><div className="text-center"><div className={`text-4xl font-semibold ${color}`}>{score}</div><div className="text-xs text-zinc-400">/ 100</div></div></div></div>
}
function getStatusTone(score: number) { if (score >= 80) return 'green'; if (score >= 60) return 'gold'; return 'red' }
function formatNow() { return new Date().toLocaleString('zh-TW', { hour12: false }) }

export default function DeepResearchDashboard() {
  const [updatedAt, setUpdatedAt] = useState('尚未刷新')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [marketCards, setMarketCards] = useState(demoMarketCards)
  const [macroEvents, setMacroEvents] = useState(demoMacroEvents)
  const [sectors, setSectors] = useState(demoSectors)
  const [watchlist, setWatchlist] = useState(demoWatchlist)
  const [latestAlert, setLatestAlert] = useState({ title: '等待下一個高影響數據公布', detail: '若 CPI / PCE 低於預期，通常有利降息預期與科技股風險偏好；若非農過強或 Powell 偏鷹，QQQ 與高 Beta Buy Call 需降低倉位。', updated: false })

  const buyCallScore = useMemo(() => {
    const qqqStrong = marketCards.find((m) => m.label === 'QQQ')?.status === 'up' ? 18 : 10
    const spyStrong = marketCards.find((m) => m.label === 'SPY')?.status === 'up' ? 15 : 8
    const vixOk = marketCards.find((m) => m.label === 'VIX')?.status === 'down' ? 18 : 8
    const sectorAvg = sectors.reduce((sum, s) => sum + s.strength, 0) / sectors.length
    const stockAvg = watchlist.reduce((sum, w) => sum + w.score, 0) / watchlist.length
    return Math.max(0, Math.min(100, Math.round(qqqStrong + spyStrong + vixOk + sectorAvg * 0.25 + stockAvg * 0.25)))
  }, [marketCards, sectors, watchlist])

  const marketStatus = buyCallScore >= 80 ? 'Risk On' : buyCallScore >= 60 ? 'Neutral' : 'Risk Off'
  const statusTone = getStatusTone(buyCallScore)

  async function refreshData() {
    setLoading(true)
    const [market, macro, sectorData, watchData] = await Promise.all([
      safeFetch('/api/market', demoMarketCards), safeFetch('/api/macro', demoMacroEvents), safeFetch('/api/sectors', demoSectors), safeFetch('/api/watchlist', demoWatchlist),
    ])
    setMarketCards(Array.isArray(market) ? market : demoMarketCards)
    setMacroEvents(Array.isArray(macro) ? macro : demoMacroEvents)
    setSectors(Array.isArray(sectorData) ? sectorData : demoSectors)
    setWatchlist(Array.isArray(watchData) ? watchData : demoWatchlist)
    const hasRealSource = [...(Array.isArray(market) ? market : [])].some((x: any) => x.source && x.source !== 'Demo')
    setConnected(hasRealSource)
    setUpdatedAt(formatNow())
    setLatestAlert({ title: hasRealSource ? '最新數據已更新' : '目前使用示範資料', detail: hasRealSource ? '市場報價與總經資料已完成更新，請重新檢查 Risk On / Risk Off 與 Buy Call 評分。' : '前端已預留即時 API 串接位置；部署後端與資料商 API 後，這裡會顯示最新公布資料與提醒。', updated: hasRealSource })
    setLoading(false)
  }
  useEffect(() => { refreshData(); const timer = setInterval(refreshData, 60_000); return () => clearInterval(timer) }, [])

  return <div className="min-h-screen bg-[#0D0D0D] p-4 text-[#F3F1EC] md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm text-[#C8A96B]"><Sparkles size={16} /> 深度研究系統</div><h1 className="text-3xl font-semibold tracking-tight md:text-5xl">深度研究儀表板</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">整合總經、流動性、市場情緒、板塊輪動、強勢股與選擇權條件，用來判斷今天是否適合進攻 Buy Call。</p></div><div className="flex flex-wrap items-center gap-2"><Pill tone={connected ? 'green' : 'red'}>{connected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}{connected ? '即時串接' : '示範資料'}</Pill><Pill tone={statusTone}>{statusTone === 'green' ? '🟢' : statusTone === 'red' ? '🔴' : '🟡'} {marketStatus}</Pill><Button onClick={refreshData} disabled={loading} className="rounded-2xl bg-[#C8A96B] text-black hover:bg-[#E6C77D]"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? '更新中' : '刷新數據'}</Button></div></motion.div>
    <Card className="rounded-3xl border-[#C8A96B]/20 bg-gradient-to-r from-[#161616] to-[#0D0D0D]"><CardContent className="grid gap-4 p-5 md:grid-cols-3 md:items-center"><div className="md:col-span-2"><div className="mb-2 flex items-center gap-2"><Bell className="h-5 w-5 text-[#E6C77D]" /><span className="font-semibold text-[#E6C77D]">最新數據提醒欄位</span>{latestAlert.updated && <Pill tone="green">NEW</Pill>}</div><div className="text-lg font-semibold">{latestAlert.title}</div><p className="mt-2 text-sm leading-7 text-zinc-300">{latestAlert.detail}</p></div><div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400"><div className="flex items-center gap-2 text-[#C8A96B]"><Database className="h-4 w-4" /> 資料更新狀態</div><div className="mt-2">最後更新：{updatedAt}</div><div className="mt-1">自動刷新：每 60 秒</div></div></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-6">{marketCards.map((m) => <Card key={m.label} className="rounded-3xl border-white/10 bg-[#161616] shadow-xl"><CardContent className="p-4"><div className="flex items-center justify-between text-sm text-zinc-400"><span>{m.label}</span>{m.status === 'up' ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : <ArrowDownRight className="h-4 w-4 text-red-300" />}</div><div className="mt-3 text-2xl font-semibold">{m.value}</div><div className={m.status === 'up' ? 'text-sm text-emerald-300' : 'text-sm text-red-300'}>{m.chg}</div><div className="mt-2 text-[10px] text-zinc-600">Source: {m.source || 'API'}</div></CardContent></Card>)}</div>
    <div className="grid gap-6 lg:grid-cols-3"><Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616] lg:col-span-2"><CardContent className="p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-lg font-semibold"><CalendarClock className="text-[#C8A96B]" /> 高影響經濟數據</div><Pill tone="blue">CPI / PCE / NFP / FOMC</Pill></div><div className="grid gap-3 md:grid-cols-2">{macroEvents.map((e) => <div key={e.name} className="rounded-2xl border border-white/10 bg-[#0D0D0D] p-4"><div className="flex items-center justify-between"><span className="font-medium">{e.name}</span><div className="flex items-center gap-2">{e.updated && <Pill tone="green">NEW</Pill>}<Pill>{e.impact}</Pill></div></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400"><div><div className="text-zinc-600">Actual</div><div className="mt-1 text-zinc-200">{e.actual}</div></div><div><div className="text-zinc-600">Forecast</div><div className="mt-1 text-zinc-200">{e.forecast}</div></div><div><div className="text-zinc-600">Previous</div><div className="mt-1 text-zinc-200">{e.previous}</div></div></div><div className="mt-3 text-sm text-zinc-500">{e.time}</div></div>)}</div></CardContent></Card><Card className="rounded-3xl border-[#C8A96B]/20 bg-[#161616]"><CardContent className="p-6"><div className="mb-4 flex items-center gap-2 text-lg font-semibold"><Gauge className="text-[#C8A96B]" /> Buy Call 環境評分</div><ScoreRing score={buyCallScore} /><div className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${statusTone === 'green' ? 'bg-emerald-500/10 text-emerald-200' : statusTone === 'red' ? 'bg-red-500/10 text-red-200' : 'bg-[#C8A96B]/10 text-[#E6C77D]'}`}>目前狀態：{marketStatus}。評分越高，代表大盤、情緒、板塊與強勢股條件越接近適合 Buy Call 的環境。</div></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-3"><Card className="rounded-3xl border-white/10 bg-[#161616]"><CardContent className="p-6"><div className="mb-4 flex items-center gap-2 text-lg font-semibold"><LineChart className="text-[#C8A96B]" /> 板塊輪動</div><div className="space-y-4">{sectors.map((s) => <div key={s.name}><div className="mb-2 flex justify-between text-sm"><span>{s.name} {s.updated && <span className="ml-1 text-emerald-300">●</span>}</span><span className="text-[#E6C77D]">{s.strength}</span></div><div className="h-2 rounded-full bg-black/40"><div className="h-2 rounded-full bg-[#C8A96B]" style={{ width: `${s.strength}%` }} /></div><div className="mt-1 text-xs text-zinc-500">{s.note}</div></div>)}</div></CardContent></Card><Card className="rounded-3xl border-white/10 bg-[#161616]"><CardContent className="p-6"><div className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="text-[#C8A96B]" /> 強勢股雷達</div><div className="space-y-3">{watchlist.map((w) => <div key={w.ticker} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="flex items-center justify-between"><span className="text-lg font-semibold">{w.ticker} {w.updated && <span className="text-sm text-emerald-300">●</span>}</span><Pill tone={w.score >= 80 ? 'green' : 'gold'}>{w.score}</Pill></div><div className="mt-1 text-xs text-zinc-500">{w.sector}</div><div className="mt-2 text-sm text-zinc-300">{w.setup}</div></div>)}</div></CardContent></Card><Card className="rounded-3xl border-white/10 bg-[#161616]"><CardContent className="p-6"><div className="mb-4 flex items-center gap-2 text-lg font-semibold"><Activity className="text-[#C8A96B]" /> Options Checklist</div><div className="space-y-3">{optionChecklist.map((o) => <div key={o.item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4"><div><div className="font-medium">{o.item}</div><div className="text-xs text-zinc-500">{o.value}</div></div><div className={o.pass ? 'text-emerald-300' : 'text-red-300'}>{o.pass ? <CheckCircle2 className="h-5 w-5" /> : '注意'}</div></div>)}</div><div className="mt-5 rounded-2xl border border-[#C8A96B]/20 p-4 text-sm leading-6 text-zinc-300">先判斷總經與市場情緒，再看板塊強度與強勢股，最後才檢查 DTE、Delta、IV 與進場位置。</div></CardContent></Card></div>
  </div></div>
}
