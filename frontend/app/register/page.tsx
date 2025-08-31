'use client'

import { useAccount, useWalletClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SwiftClient } from '@swift-protocol/sdk'
import { abiAgentRegistry, abiAgentMessenger, abiStreamManager } from '@/abis'
import { RegisterAgent } from '@/components/RegisterAgent'
import {
  AGENT_REGISTRY_ADDRESS,
  AGENT_MESSENGER_ADDRESS,
  STREAM_MANAGER_ADDRESS,
} from '@/lib/addresses'

export default function RegisterPage() {
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [mounted, setMounted] = useState(false)
  const [swift, setSwift] = useState<SwiftClient>()
  const [registered, setRegistered] = useState(false)

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

        // Check registration status
        const isReg = await client.isAgentRegistered(address)
        setRegistered(isReg)
        console.log('🔍 Registration status:', isReg)
      } catch (err) {
        console.error('⚠️ Failed to initialize SwiftClient:', err)
      }
    }

    initSwift()
  }, [isConnected, walletClient, address])

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Register Your Agent</h1>

      <div className="max-w-xl mx-auto">
        {!mounted ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : isConnected ? (
          <RegisterAgent
            swift={swift}
            registered={registered}
            onRegistered={() => setRegistered(true)}
          />
        ) : (
          <p className="text-center text-gray-500">Please connect your wallet</p>
        )}
      </div>
    </main>
  )
}
