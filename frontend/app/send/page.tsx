'use client'

import { useAccount, useWalletClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SwiftClient } from '@swift-protocol/sdk'
import { abiAgentRegistry, abiAgentMessenger, abiStreamManager } from '@/abis'
import StreamForm from "@/components/StreamForm"
import {
  AGENT_REGISTRY_ADDRESS,
  AGENT_MESSENGER_ADDRESS,
  STREAM_MANAGER_ADDRESS,
} from '@/lib/addresses'

export default function SendPage() {
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [mounted, setMounted] = useState(false)
  const [swift, setSwift] = useState<SwiftClient>()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const initSwift = async () => {
      if (!isConnected || !walletClient || !address) return

      try {
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

        // ✅ Debug logs to verify registration and setup
        console.log('✅ SwiftClient initialized:', client)
        console.log('👤 Wallet Address:', address)

        const isRegistered = await client.isAgentRegistered(address)
        console.log('🔍 isAgentRegistered:', isRegistered)

        if (!isRegistered) {
          console.warn('⚠️ Agent is NOT registered. You must register before sending messages.')
        }
      } catch (err) {
        console.error('❌ Failed to initialize SwiftClient:', err)
      }
    }

    initSwift()
  }, [isConnected, walletClient, address])

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Send a Message</h1>

      <div className="max-w-xl mx-auto">
        {!mounted ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : isConnected ? (
          <StreamForm swift={swift} />
        ) : (
          <p className="text-center text-gray-500">Please connect your wallet</p>
        )}
      </div>
    </main>
  )
}
