'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-4 font-medium text-lg">
        <Link href="/">Swift</Link>
        <Link href="/register" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
          Register
        </Link>
        <Link href="/send" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
          Send
        </Link>
        <Link
          href="/inbox"
          className="text-sm text-gray-500 hover:text-black dark:hover:text-white"
        >
          Inbox
        </Link>
      </div>
      <ConnectButton />
    </nav>
  )
}
