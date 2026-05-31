import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json([
    { ticker: 'NVDA', sector: 'AI', setup: 'EMA多頭｜回踩20日', score: 88, updated: true },
    { ticker: 'MSFT', sector: 'AI', setup: '突破整理｜相對強', score: 82, updated: true },
    { ticker: 'COIN', sector: 'BTC', setup: 'BTC Risk On｜量能轉強', score: 79, updated: true },
    { ticker: 'PANW', sector: '資安', setup: '財報後強勢｜站上40日', score: 76, updated: false },
    { ticker: 'OKLO', sector: '核能', setup: '題材強｜等右側確認', score: 69, updated: false }
  ])
}
