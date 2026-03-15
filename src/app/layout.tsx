import type { Metadata } from 'next'
import Link from 'next/link'
import { TRPCReactProvider } from '@/trpc/client'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'devroast',
  description: 'paste your code. get roasted.',
}

function Navbar() {
  return (
    <nav className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-10">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-mono text-xl font-bold text-emerald-500">{'>'}</span>
        <span className="font-mono text-lg font-medium text-zinc-50">devroast</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/leaderboard"
          className="font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          leaderboard
        </Link>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TRPCReactProvider>
          <Navbar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  )
}
