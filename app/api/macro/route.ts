import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json([
    { name: 'CPI', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false },
    { name: 'FOMC', actual: '等待會議', forecast: '—', previous: '—', time: '下次會議：依 Fed 日曆', impact: '極高', updated: false },
    { name: '非農 NFP', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false },
    { name: 'PCE', actual: '等待公布', forecast: '—', previous: '—', time: '下次公布：依經濟日曆', impact: '高', updated: false }
  ])
}
