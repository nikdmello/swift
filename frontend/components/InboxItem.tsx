'use client'

import { useEffect, useState } from 'react'
import { ethers, formatEther } from 'ethers'
import { useWalletClient } from 'wagmi'
import { abiStreamManager } from '@/abis'
import { STREAM_MANAGER_ADDRESS } from '@/lib/addresses'


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
  if (duration === 0n) return '0'
  const now = nowOverride ?? BigInt(Math.floor(Date.now() / 1000))
  const elapsed = now > start ? now - start : 0n
  const maxSeconds = duration * 60n
  if (maxSeconds === 0n) return '0'
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
  const [isActive, setIsActive] = useState(true)
  const [actualStream, setActualStream] = useState<any>(null)

  // Use cancellation time if stream was cancelled, otherwise use current time
  const effectiveNow = streamCancelledAt || (actualStream && !actualStream.active ? BigInt(Math.floor(Date.now() / 1000)) : now)
  
  const progress = getProgressPercent(msg.timestamp, msg.durationMinutes, effectiveNow)
  const timeLeft = getRemainingTime(msg.timestamp, msg.durationMinutes, effectiveNow)
  const total = msg.amountPerMinute * BigInt(msg.durationMinutes)
  const streamed = getTotalStreamed(total, msg.timestamp, msg.durationMinutes, effectiveNow)

  const [owed, setOwed] = useState<bigint>(0n)
  const [withdrawing, setWithdrawing] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    async function checkStreamStatus() {
      try {
        if (!walletClient) return
        const provider = new ethers.BrowserProvider(walletClient.transport)
        const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, provider)
        
        // Check actual stream status from blockchain
        const stream = await contract.getStream(msg.from, msg.to)
        setActualStream(stream)
        setIsActive(stream.active)
        
        // Always check owed if recipient (even for cancelled streams)
        if (isRecipient) {
          const amount = await contract.getOwed(msg.from, msg.to)
          console.log(`Owed amount for ${msg.from} -> ${msg.to}:`, ethers.formatEther(amount), 'ETH')
          console.log('Stream active:', stream.active)
          setOwed(amount)
        }
      } catch (err) {
        console.warn('Stream status check failed:', err)
      }
    }

    checkStreamStatus()
    const interval = setInterval(checkStreamStatus, 5000)
    return () => clearInterval(interval)
  }, [msg.from, msg.to, isRecipient, walletClient])

  async function handleWithdraw() {
    try {
      setWithdrawing(true)
      const provider = new ethers.BrowserProvider(walletClient!.transport)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, signer)

      const tx = await contract.withdraw(msg.from)
      await tx.wait()
      
      // Reset owed amount immediately
      setOwed(0n)
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
      const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, signer)

      const stream = await contract.getStream(msg.from, msg.to)
      if (!stream.active) {
        alert('⚠️ Stream is already inactive.')
        setCancelling(false)
        return
      }

      const tx = await contract.cancelStream(msg.to)
      await tx.wait()
      
      // Update local state immediately
      setIsActive(false)
      setStreamCancelledAt(BigInt(Math.floor(Date.now() / 1000)))
      setCancelling(false)
      
      // Don't reset owed to 0 - let the blockchain state update naturally
      // The contract pays out owed funds during cancellation
      
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
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {isSender ? 'Sent to' : 'From'}
        </div>
        <div className="font-mono text-sm text-blue-600 truncate">
          {isSender ? msg.to : msg.from}
        </div>
        {isSender && (
          <div className="text-xs text-green-600 mt-1">You sent this</div>
        )}
        {isRecipient && (
          <div className="text-xs text-blue-600 mt-1">You received this</div>
        )}
      </div>

      <p className="text-lg font-semibold mb-3 text-black dark:text-white">
        {msg.payload.body}
      </p>

      <div className="text-sm text-gray-700 mb-1">
        <strong>{formatEther(msg.amountPerMinute)} ETH/min</strong> for{' '}
        <strong>{msg.durationMinutes.toString()} minutes</strong>
      </div>

      <div className="text-sm text-gray-600 mb-1">
        Status: {isActive ? `${timeLeft} remaining` : 'Ended'}
      </div>

      <div className="text-sm text-gray-600 mb-2">
        Total streamed: {streamed} ETH
      </div>

      {isRecipient && owed > 0n && (
        <div className="text-sm text-green-600 mt-2">
          Available: {formatEther(owed)} ETH
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
