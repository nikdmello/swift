'use client'

import { useEffect, useState } from 'react'
import { ethers, formatEther } from 'ethers'
import { useWalletClient } from 'wagmi'
import { abiStreamManager } from '@/abis'
import { STREAM_MANAGER_ADDRESS } from '@/lib/addresses'

const EXPLORER_URL = 'https://sepolia.basescan.org/tx/'

export function InboxItem({ msg, receiver }: { msg: any; receiver: `0x${string}` }) {
  const { data: walletClient } = useWalletClient()

  const isSender = msg.from.toLowerCase() === receiver.toLowerCase()
  const isRecipient = msg.to.toLowerCase() === receiver.toLowerCase()

  const [owed, setOwed] = useState<bigint>(0n)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelledAt, setCancelledAt] = useState<bigint | null>(null)
  const [escrowBalance, setEscrowBalance] = useState<bigint>(0n)
  const [totalWithdrawn, setTotalWithdrawn] = useState<bigint>(0n)

  // Calculate if stream has naturally expired
  const now = BigInt(Math.floor(Date.now() / 1000))
  const streamEndTime = msg.timestamp + (msg.durationMinutes * 60n)
  const hasExpired = now >= streamEndTime
  
  // Use cancellation time if cancelled, otherwise current time
  const effectiveTime = cancelledAt || now
  const effectiveEndTime = cancelledAt || (hasExpired ? streamEndTime : now)
  
  // Calculate progress (freeze at cancellation time)
  const elapsed = effectiveTime > msg.timestamp ? effectiveTime - msg.timestamp : 0n
  const totalDuration = msg.durationMinutes * 60n
  const progress = totalDuration > 0n ? Math.min(100, Number((elapsed * 100n) / totalDuration)) : 100
  
  // Calculate time remaining (freeze at cancellation)
  const secondsLeft = cancelledAt ? 0n : (hasExpired ? 0n : streamEndTime - now)
  const minutesLeft = Number(secondsLeft / 60n)
  const secsLeft = Number(secondsLeft % 60n)
  const timeLeft = cancelledAt ? "Cancelled" : (hasExpired ? "Ended" : `${minutesLeft}m ${secsLeft}s`)

  useEffect(() => {
    async function checkStream() {
      if (!walletClient) return

      try {
        const provider = new ethers.BrowserProvider(walletClient.transport)
        const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, provider)
        
        // Check if stream exists and is active on blockchain
        const stream = await contract.getStream(msg.from, msg.to)
        setIsStreamActive(stream.active)
        
        // Check owed amount and escrow balance for recipients
        if (isRecipient) {
          const owedAmount = await contract.getOwed(msg.from, msg.to)
          const streamBalance = stream.balance || 0n // Remaining escrow balance
          
          // Calculate total withdrawn: original total - current balance - owed
          const originalTotal = msg.amountPerMinute * BigInt(msg.durationMinutes)
          const withdrawn = originalTotal - streamBalance - owedAmount
          
          console.log(`Stream finances: Total=${ethers.formatEther(originalTotal)} ETH, Balance=${ethers.formatEther(streamBalance)} ETH, Owed=${ethers.formatEther(owedAmount)} ETH, Withdrawn=${ethers.formatEther(withdrawn)} ETH`)
          
          setOwed(owedAmount)
          setEscrowBalance(streamBalance)
          setTotalWithdrawn(withdrawn > 0n ? withdrawn : 0n)
        }
      } catch (err) {
        console.warn('Stream check failed:', err)
        setIsStreamActive(false)
      }
    }

    checkStream()
    const interval = setInterval(checkStream, 5000)
    return () => clearInterval(interval)
  }, [msg.from, msg.to, isRecipient, walletClient])

  async function handleWithdraw() {
    if (!walletClient) return
    
    try {
      setWithdrawing(true)
      const provider = new ethers.BrowserProvider(walletClient.transport)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, signer)

      const tx = await contract.withdraw(msg.from)
      await tx.wait()
      
      // Refresh financial data after withdrawal
      const updatedStream = await contract.getStream(msg.from, msg.to)
      const newOwed = await contract.getOwed(msg.from, msg.to)
      const newBalance = updatedStream.balance || 0n
      const originalTotal = msg.amountPerMinute * BigInt(msg.durationMinutes)
      const newWithdrawn = originalTotal - newBalance - newOwed
      
      setOwed(newOwed)
      setEscrowBalance(newBalance)
      setTotalWithdrawn(newWithdrawn > 0n ? newWithdrawn : 0n)
      
      alert('Withdraw successful!')
    } catch (err: any) {
      console.error('Withdraw failed:', err)
      alert(`Withdraw failed: ${err.message}`)
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleCancel() {
    if (!walletClient) return
    
    try {
      setCancelling(true)
      const provider = new ethers.BrowserProvider(walletClient.transport)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(STREAM_MANAGER_ADDRESS, abiStreamManager, signer)

      const tx = await contract.cancelStream(msg.to)
      await tx.wait()
      
      // Record the cancellation time to freeze calculations
      setCancelledAt(BigInt(Math.floor(Date.now() / 1000)))
      setIsStreamActive(false)
      alert('Stream cancelled!')
    } catch (err: any) {
      console.error('Cancel failed:', err)
      alert(`Cancel failed: ${err.message}`)
    } finally {
      setCancelling(false)
    }
  }

  const total = msg.amountPerMinute * BigInt(msg.durationMinutes)
  // Freeze streamed amount at cancellation time
  const streamedAmount = cancelledAt ? (total * elapsed) / totalDuration : 
                        hasExpired ? total : (total * elapsed) / totalDuration

  return (
    <li className="rounded-xl border border-gray-700 shadow-md p-6 bg-gray-800 transition hover:shadow-lg">
      <div className="mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {isSender ? 'Sent to' : 'From'}
        </div>
        <div className="font-mono text-sm text-blue-600 truncate">
          {isSender ? msg.to : msg.from}
        </div>
      </div>

      <p className="text-lg font-semibold mb-3 text-white">
        {msg.payload.body}
      </p>

      <div className="text-sm text-gray-300 mb-1">
        <strong>{formatEther(msg.amountPerMinute)} ETH/min</strong> for{' '}
        <strong>{msg.durationMinutes.toString()} minutes</strong>
      </div>

      <div className="text-sm text-gray-400 mb-1">
        Status: {timeLeft}
      </div>

      <div className="text-sm text-gray-400 mb-2">
        Streamed: {formatEther(streamedAmount)} ETH
      </div>

      {/* Financial breakdown for recipients */}
      {isRecipient && (
        <div className="text-sm text-gray-400 mb-2 space-y-1">
          <div>Withdrawn: {formatEther(totalWithdrawn)} ETH</div>
          <div>Escrow balance: {formatEther(escrowBalance)} ETH</div>
        </div>
      )}

      {/* Withdraw button for recipients - show if any funds are owed */}
      {isRecipient && owed > 0n && (
        <div className="text-sm text-green-600 mt-2">
          Available: {formatEther(owed)} ETH
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="ml-4 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      )}
      
      {/* Debug info - remove this later */}
      {isRecipient && (
        <div className="text-xs text-gray-500 mt-1">
          Debug: Owed={formatEther(owed)} ETH, Active={isStreamActive.toString()}, Expired={hasExpired.toString()}
        </div>
      )}

      {/* Cancel button for senders - only show if stream is active and not expired and not cancelled */}
      {isSender && isStreamActive && !hasExpired && !cancelledAt && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-2 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Stream'}
        </button>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden mb-4 mt-2">
        <div
          className={`h-full transition-all duration-500 ${
            cancelledAt ? 'bg-red-400' :
            isStreamActive && !hasExpired ? 'bg-green-500' : 
            hasExpired ? 'bg-blue-500' : 'bg-red-400'
          }`}
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