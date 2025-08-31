'use client'

import { useAccount, useWalletClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SwiftClient } from '@swift-protocol/sdk'
import { abiAgentRegistry, abiAgentMessenger, abiStreamManager } from '@/abis'
import {
  AGENT_REGISTRY_ADDRESS,
  AGENT_MESSENGER_ADDRESS,
  STREAM_MANAGER_ADDRESS,
} from '@/lib/addresses'

export default function HomePage() {
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [swift, setSwift] = useState<SwiftClient | null>(null)
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const initSwift = async () => {
      if (!isConnected || !walletClient || !address) return

      try {
        // Use the walletClient.transport instead of window.ethereum
        const provider = new ethers.BrowserProvider(walletClient.transport)
        const signer = await provider.getSigner()

        const client = new SwiftClient(
          signer,
          provider,
          AGENT_REGISTRY_ADDRESS,
          AGENT_MESSENGER_ADDRESS,
          STREAM_MANAGER_ADDRESS,
          abiAgentRegistry,
          abiAgentMessenger,
        )

        setSwift(client)

        const registered = await client.isAgentRegistered(address)
        setIsRegistered(registered)
      } catch (err) {
        console.error('⚠️ Failed to initialize SwiftClient:', err)
      }
    }

    initSwift()
  }, [isConnected, walletClient, address])

  return (
    <main className="min-h-screen p-8 text-center flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Swift Protocol</h1>
      <p className="text-gray-600 max-w-lg mb-6">
        Agent-to-agent messaging with streaming ETH payments over Base or Hardhat.
      </p>

      <div className="max-w-xl">
        {!mounted ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : isConnected ? (
          isRegistered ? (
            <a
              href="/send"
              className="inline-block px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Go to Send →
            </a>
          ) : (
            <a
              href="/register"
              className="inline-block px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Register Your Agent →
            </a>
          )
        ) : (
          <p className="text-sm text-gray-500">Please connect your wallet</p>
        )}
      </div>
    </main>
  )
}
