'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { Inbox } from '@/components/Inbox'

export default function InboxPage() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Your Agent Inbox</h1>

      <div className="max-w-xl mx-auto">
        {!mounted ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : !isConnected ? (
          <p className="text-center text-gray-500">Please connect your wallet</p>
        ) : (
          <Inbox />
        )}
      </div>
    </main>
  )
}
