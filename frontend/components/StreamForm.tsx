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
  const [message, setMessage] = useState('Payment for services') // Custom message
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

      // Check and cancel existing stream first
      try {
        const existingStream = await client.streamManager.getStream(address, recipient)
        if (existingStream.active) {
          console.log('Cancelling existing stream...')
          const cancelTx = await client.streamManager.cancelStream(recipient)
          await cancelTx.wait()
          console.log('Existing stream cancelled')
        }
      } catch (err) {
        console.log('No existing stream to cancel')
      }

      const totalEth = ethers.parseEther(amountEth)
      const flowRatePerSecond = totalEth / BigInt(durationMinutes * 60)
      const amountPerMinute = flowRatePerSecond * 60n
      const expectedTotal = amountPerMinute * BigInt(durationMinutes)

      const tx = await client.agentMessenger.sendMessageWithStream(
        recipient,
        "text",
        JSON.stringify({ body: message }),
        amountPerMinute,
        durationMinutes,
        { value: expectedTotal }
      )
      
      await tx.wait()

      setStatus('✅ Stream + message sent!')
    } catch (err: any) {
      console.error(err)
      setStatus(`❌ Stream or message failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send Payment Stream</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total ETH Amount</label>
          <input
            type="text"
            value={amountEth}
            onChange={(e) => setAmountEth(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-sm text-gray-500 mt-2">
            Streaming rate: {amountEth && durationMinutes ? (parseFloat(amountEth) / durationMinutes).toFixed(6) : '0'} ETH/min
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Payment for services"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Payment Stream'}
        </button>

        {status && (
          <div className="mt-4 p-3 rounded-lg text-sm text-center bg-gray-50 text-gray-800">
            {status}
          </div>
        )}
      </form>
    </div>
  )
}
