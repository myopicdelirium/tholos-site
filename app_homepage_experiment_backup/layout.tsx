import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tholos.',
  description: 'inspectable / ablatable / versioned',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
