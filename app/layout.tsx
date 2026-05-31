import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '深度研究儀表板',
  description: 'Buy Call 深度研究儀表板',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  )
}
