'use client'

import { useEffect, useState } from 'react'
import { ethers, formatEther } from 'ethers'
import { useWalletClient } from 'wagmi'
import { abiStreamManager } from '@/abis'
import { STREAM_MANAGER_ADDRESS } from '@/lib/addresses'
import { StreamClient } from '@/lib/stream/StreamClient'

const EXPLORER_URL = 'https://sepolia.basescan.org/tx/'

function getRemainingTime(start: bigint, duration: bigint, nowOverride?: bigint): string {
  const now = nowOverride ?? BigInt(Math.floor(Date.now() / 1000))
  const end = start + duration * 60n
  const secondsLeft = end > now ? end - now : 0n
  const minutes = Number(secondsLeft / 60n)
  const seconds = Number(secondsLeft % 60n)
  return `${minutes}m ${seconds}s`
}

function getProgressPercent(start: bigint, duration: bigint, nowOverride?: bigint): number {
  if (duration === 0n) return 100
  const now = nowOverride ?? BigInt(Math.floor(Date.now() / 1000))
  const elapsed = now > start ? now - start : 0n
  const max = duration * 60n
  const percent = elapsed * 100n / max
  return Number(percent > 100n ? 100n : percent)
}

function getTotalStreamed(total: bigint, start: bigint, duration: bigint, nowOverride?: bigint): string {
  const now = nowOverride ?? BigInt(Math.floor(Date.now() / 1000))
  const elapsed = now > start ? now - start : 0n
  const maxSeconds = duration * 60n
  const effectiveSeconds = elapsed > maxSeconds ? maxSeconds : elapsed
  const streamed = (total * effectiveSeconds) / maxSeconds
  return formatEther(streamed)
}

export function InboxItem({ msg, receiver }: { msg: any; receiver: `0x${string}` }) {
  const { data: walletClient } = useWalletClient()

  const isSender = msg.from.toLowerCase() === receiver.toLowerCase()
  const isRecipient = msg.to.toLowerCase() === receiver.toLowerCase()

  const [streamCancelledAt, setStreamCancelledAt] = useState<bigint | null>(null)
  const now = streamCancelledAt ?? BigInt(Math.floor(Date.now() / 1000))
  const [isActive, setIsActive] = useState(() => {
    return now < msg.timestamp + msg.durationMinutes * 60n
  })

  const progress = getProgressPercent(msg.timestamp, msg.durationMinutes, now)
  const timeLeft = getRemainingTime(msg.timestamp, msg.durationMinutes, now)
  const total = msg.amountPerMinute * BigInt(msg.durationMinutes)
  const streamed = getTotalStreamed(total, msg.timestamp, msg.durationMinutes, now)

  const [owed, setOwed] = useState<bigint>(0n)
  const [withdrawing, setWithdrawing] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    async function checkOwed() {
      try {
        if (!walletClient) return
        const provider = new ethers.BrowserProvider(walletClient.transport)
        const client = new StreamClient(provider)
        const amount = await client.getOwed(msg.from, msg.to)
        setOwed(amount)
      } catch (err) {
        console.warn('getOwed failed:', err)
      }
    }

    if (isRecipient) {
      checkOwed()
      const interval = setInterval(checkOwed, 5000)
      return () => clearInterval(interval)
    }
  }, [msg.from, msg.to, isRecipient, walletClient])

  async function handleWithdraw() {
    try {
      setWithdrawing(true)
      const provider = new ethers.BrowserProvider(walletClient!.transport)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, signer)

      const tx = await contract.withdraw(msg.from)
      await tx.wait()
      setWithdrawing(false)
      alert('✅ Withdraw successful!')
    } catch (err: any) {
      console.error('Withdraw failed:', err)
      alert(`❌ Withdraw failed: ${err.message || err}`)
      setWithdrawing(false)
    }
  }

  async function handleCancel() {
    try {
      setCancelling(true)
      const provider = new ethers.BrowserProvider(walletClient!.transport)
      const signer = await provider.getSigner()
      const client = new StreamClient(signer)

      const stream = await client.getStream(msg.from, msg.to)
      if (!stream.active) {
        alert('⚠️ Stream is already inactive.')
        setCancelling(false)
        return
      }

      const tx = await client.cancelStream(msg.to)
      await provider.waitForTransaction(tx.hash!)
      setIsActive(false)
      setStreamCancelledAt(BigInt(Math.floor(Date.now() / 1000)))
      setCancelling(false)
      alert('✅ Stream cancelled.')
    } catch (err: any) {
      console.error('Cancel failed:', err)
      alert(`❌ Cancel failed: ${err.message || err}`)
      setCancelling(false)
    }
  }

  return (
    <li className="rounded-xl border shadow-md p-6 bg-white dark:bg-zinc-900 transition hover:shadow-lg">
      <div className="mb-4">
        <div className="text-xs text-gray-400">📨 From</div>
        <div className="font-mono text-sm text-blue-600 truncate">{msg.from}</div>
      </div>

      <p className="text-lg font-semibold mb-3 text-black dark:text-white">
        {msg.payload.body}
      </p>

      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
        💸 <strong>{formatEther(msg.amountPerMinute)} ETH/min</strong> for{' '}
        <strong>{msg.durationMinutes.toString()} min</strong>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        ⏱ {isActive ? `🟢 ${timeLeft} left` : '🔴 Ended'}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        🔁 Total streamed: {streamed} ETH
      </div>

      {isRecipient && owed > 0n && (
        <div className="text-sm text-green-600 dark:text-green-400 mt-2">
          💰 Owed: {formatEther(owed)} ETH
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="ml-4 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      )}

      {isSender && isActive && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-2 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Stream'}
        </button>
      )}

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4 mt-2">
        <div
          className={`h-full transition-all duration-500 ${isActive ? 'bg-green-500' : 'bg-red-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <a
          href={`${EXPLORER_URL}${msg.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-blue-500"
        >
          View TX ↗
        </a>
        <span>Block: {msg.blockNumber.toString()}</span>
      </div>
    </li>
  )
}
