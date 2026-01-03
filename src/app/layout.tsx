import './globals.css'
import type { Metadata } from 'next'
import { Ibarra_Real_Nova, Inter } from 'next/font/google'
import SiteNav from '../components/SiteNav'

const ui = Inter({ subsets: ['latin'], variable: '--font-ui' })
const display = Ibarra_Real_Nova({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Tholos.',
  description: 'Myopic Delirium',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ui.variable} ${display.variable} bg-[#E8E5E0] text-[#1b1b1b]`}>
        <SiteNav />
        <div className="pt-14">{children}</div>
      </body>
    </html>
  )
}
