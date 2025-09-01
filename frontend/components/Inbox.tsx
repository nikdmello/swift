'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { abiAgentMessenger } from '@/abis'
import { AGENT_MESSENGER_ADDRESS } from '@/lib/addresses'
import { InboxItem } from '@/components/InboxItem'

type Message = {
  from: string
  to: string
  type: string
  payload: any
  txHash: string
  blockNumber: bigint
  amountPerMinute: bigint
  durationMinutes: bigint
  timestamp: bigint
}

export function Inbox() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    async function init() {
      if (!isConnected || !walletClient || !address) return

      try {
        const provider = new ethers.BrowserProvider(walletClient.transport)
        const contract = new ethers.Contract(AGENT_MESSENGER_ADDRESS, abiAgentMessenger, provider)

        const sentFilter = contract.filters.MessageSent(address, undefined)
        const receivedFilter = contract.filters.MessageSent(undefined, address)

        // Query from recent blocks to avoid RPC limits
        const currentBlock = await provider.getBlockNumber()
        const fromBlock = Math.max(0, currentBlock - 1000) // Last ~1k blocks to avoid RPC issues
        
        const [sentLogs, receivedLogs] = await Promise.all([
          contract.queryFilter(sentFilter, fromBlock, 'latest'),
          contract.queryFilter(receivedFilter, fromBlock, 'latest')
        ])

        const merged = [...sentLogs, ...receivedLogs]

        const seen = new Set<string>()
        const uniqueLogs = merged.filter(log => {
          const key = log.transactionHash + ((log as any).logIndex?.toString() ?? '')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        const allLogs = uniqueLogs.sort(
          (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
        )

        const parsed: Message[] = allLogs.map((log: any) => {
          let payload = {}
          try {
            payload = JSON.parse(log.args.payload)
          } catch (e) {
            console.warn('⚠️ Failed to parse payload:', log.args.payload)
          }

          return {
            from: log.args.sender,
            to: log.args.recipient,
            type: log.args.messageType,
            payload,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            amountPerMinute: log.args.amountPerMinute,
            durationMinutes: log.args.durationMinutes,
            timestamp: log.args.timestamp,
          }
        })

        setMessages(parsed)
      } catch (err) {
        console.error('❌ Inbox init failed:', err)
        // Just show empty state instead of error message
        setMessages([])
      }
    }

    init()

    const interval = setInterval(() => {
      setMessages((prev) => [...prev])
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected, walletClient, address])

  if (!mounted) {
    return <p className="text-center text-gray-500">Loading...</p>
  }

  if (!isConnected) {
    return <p className="text-center text-gray-500">Please connect your wallet to view your agent inbox.</p>
  }

  if (messages.length === 0) {
    return <p className="text-center text-gray-500">No messages found for this agent.</p>
  }

  return (
    <ul className="space-y-6 max-w-2xl mx-auto">
      {messages.map((msg, idx) => (
        <InboxItem key={idx} msg={msg} receiver={address!} />
      ))}
    </ul>
  )
}
