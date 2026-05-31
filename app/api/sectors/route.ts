import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json([
    { name: 'AI', strength: 92, note: 'NVDA / MSFT / AMD 強勢', updated: true },
    { name: 'BTC / 加密', strength: 78, note: 'COIN / MSTR 轉強', updated: true },
    { name: '核能', strength: 66, note: 'OKLO / SMR 觀察回踩', updated: false },
    { name: '資安', strength: 84, note: 'PANW / CRWD / ZS 延續', updated: true },
    { name: '稀土', strength: 58, note: 'MP / UUUU 等待突破', updated: false }
  ])
}
