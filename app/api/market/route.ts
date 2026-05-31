import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json([
    { label: 'SPY', value: '638.42', chg: '+0.42%', status: 'up', source: 'Demo API' },
    { label: 'QQQ', value: '571.20', chg: '+0.68%', status: 'up', source: 'Demo API' },
    { label: 'VIX', value: '14.8', chg: '-3.1%', status: 'down', source: 'Demo API' },
    { label: 'DXY', value: '98.7', chg: '-0.18%', status: 'down', source: 'Demo API' },
    { label: '10Y', value: '4.12%', chg: '-0.05', status: 'down', source: 'Demo API' },
    { label: 'BTC', value: '102,480', chg: '+1.9%', status: 'up', source: 'Demo API' }
  ])
}
