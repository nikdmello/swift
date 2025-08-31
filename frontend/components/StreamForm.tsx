'use client'

import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { SwiftClient } from '@swift-protocol/sdk'
import {
  abiAgentRegistry,
  abiAgentMessenger,
  abiStreamManager,
} from '@/abis'
import {
  AGENT_REGISTRY_ADDRESS,
  AGENT_MESSENGER_ADDRESS,
  STREAM_MANAGER_ADDRESS,
} from '@/lib/addresses'

export default function StreamForm() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [recipient, setRecipient] = useState('')
  const [amountEth, setAmountEth] = useState('0.001') // Total ETH to escrow
  const [durationMinutes, setDurationMinutes] = useState(5) // Vesting period
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!walletClient || !isConnected || !address) {
      setStatus('Wallet not connected')
      return
    }

    setLoading(true)
    setStatus(null)

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
        abiAgentMessenger
      )

      const totalEth = ethers.parseEther(amountEth)
      const durationSeconds = durationMinutes * 60

      await client.sendSwiftMessage(recipient, totalEth, durationSeconds)

      setStatus('✅ Stream + message sent!')
    } catch (err: any) {
      console.error(err)
      setStatus(`❌ Stream or message failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Send Message + Stream</h2>

      <div>
        <label className="block text-sm mb-1">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Total ETH to escrow</label>
        <input
          type="text"
          value={amountEth}
          onChange={(e) => setAmountEth(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Vesting duration (minutes)</label>
        <input
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
          className="w-full border px-3 py-2 rounded"
        />
        <div className="text-xs text-gray-500 mt-1">
          Rate: {amountEth && durationMinutes ? (parseFloat(amountEth) / durationMinutes).toFixed(6) : '0'} ETH/min
        </div>
      </div>



      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Sending...' : 'Send Stream'}
      </button>

      {status && (
        <div className="mt-2 text-sm text-center">
          {status}
        </div>
      )}
    </form>
  )
}
