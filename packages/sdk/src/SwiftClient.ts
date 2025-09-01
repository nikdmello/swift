import { ethers } from 'ethers'
import type { InterfaceAbi } from 'ethers'

const StreamManagerArtifact = require('../../../frontend/abis/StreamManager.json')
const abiStreamManager = StreamManagerArtifact.abi as InterfaceAbi

interface StreamStruct {
  startTime: bigint
  flowRate: bigint
  lastUpdate: bigint
  balance: bigint
  active: boolean
}

interface StreamManagerMethods {
  getStream(from: string, to: string): Promise<StreamStruct>
  getOwed(from: string, to: string): Promise<bigint>
  withdraw(from: string): Promise<ethers.ContractTransactionResponse>
  cancelStream(to: string): Promise<ethers.ContractTransactionResponse>
}

export class SwiftClient {
  signer: ethers.Signer
  provider: ethers.Provider
  agentRegistry: ethers.Contract
  agentMessenger: ethers.Contract
  streamManager: ethers.Contract & StreamManagerMethods
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(
    signer: ethers.Signer,
    provider: ethers.Provider,
    agentRegistryAddress: string,
    agentMessengerAddress: string,
    streamManagerAddress: string,
    agentRegistryAbi: InterfaceAbi,
    agentMessengerAbi: InterfaceAbi
  ) {
    this.signer = signer
    this.provider = provider

    this.agentRegistry = new ethers.Contract(agentRegistryAddress, agentRegistryAbi, signer)
    this.agentMessenger = new ethers.Contract(agentMessengerAddress, agentMessengerAbi, signer)
    this.streamManager = new ethers.Contract(
      streamManagerAddress,
      abiStreamManager,
      signer
    ) as unknown as StreamManagerMethods & ethers.Contract
  }

  async registerAgent(): Promise<string> {
    const tx = await this.agentRegistry.registerAgent()
    const receipt = await tx.wait()
    if (receipt.status !== 1) {
      throw new Error('Transaction failed')
    }
    return tx.hash!
  }

  async isAgentRegistered(address: string): Promise<boolean> {
    return await this.agentRegistry.isAgentRegistered(address)
  }

  async sendSwiftMessage(
    recipient: string,
    totalEth: bigint,
    durationSeconds: number
  ): Promise<void> {
    // Check if there's an existing stream and cancel it
    try {
      const existingStream = await this.streamManager.getStream(await this.signer.getAddress(), recipient)
      if (existingStream.active) {
        console.log('🔄 Cancelling existing stream...')
        await this.cancelStream(recipient)
        console.log('✅ Existing stream cancelled')
      }
    } catch (err) {
      console.log('ℹ️ No existing stream to cancel')
    }

    const flowRatePerSecond = totalEth / BigInt(durationSeconds)
    const amountPerMinute = flowRatePerSecond * 60n
    const durationMinutes = Math.floor(durationSeconds / 60)

    const expectedTotal = amountPerMinute * BigInt(durationMinutes)

    console.log("ℹ️  Sending message with stream:")
    console.log({ amountPerMinute, durationMinutes, expectedTotal })

    const tx = await this.agentMessenger.sendMessageWithStream(
      recipient,
      "text",
      JSON.stringify({ body: "Hello from Swift Protocol!" }),
      amountPerMinute,
      durationMinutes,
      {
        value: expectedTotal
      }
    )

    console.log("✅ tx hash:", tx.hash)
    await this.provider.waitForTransaction(tx.hash)
  }

  async cancelStream(recipient: string): Promise<string> {
    const tx = await this.streamManager.cancelStream(recipient)
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Cancel stream transaction failed')
    }
    return tx.hash!
  }

  // Event listening methods
  onStreamOpened(callback: (from: string, to: string, flowRate: bigint) => void) {
    const listener = (from: string, to: string, flowRate: bigint) => {
      callback(from, to, flowRate)
    }
    this.streamManager.on('StreamOpened', listener)
    this.addEventListener('StreamOpened', listener)
  }

  onWithdrawn(callback: (to: string, from: string, amount: bigint) => void) {
    const listener = (to: string, from: string, amount: bigint) => {
      callback(to, from, amount)
    }
    this.streamManager.on('Withdrawn', listener)
    this.addEventListener('Withdrawn', listener)
  }

  onStreamCancelled(callback: (from: string, to: string, refunded: bigint) => void) {
    const listener = (from: string, to: string, refunded: bigint) => {
      callback(from, to, refunded)
    }
    this.streamManager.on('StreamCancelled', listener)
    this.addEventListener('StreamCancelled', listener)
  }

  // Listen for incoming streams to a specific address
  async listenForIncomingStreams(address: string, callback: (from: string, flowRate: bigint) => void) {
    const filter = this.streamManager.filters.StreamOpened(null, address)
    this.streamManager.on(filter, (from: string, to: string, flowRate: bigint) => {
      callback(from, flowRate)
    })
  }

  // Auto-withdraw when funds are available
  async startAutoWithdraw(checkInterval: number = 30000) {
    const myAddress = await this.signer.getAddress()
    
    // Listen for new streams to me
    await this.listenForIncomingStreams(myAddress, async (from: string, flowRate: bigint) => {
      console.log(`🌊 New stream detected from ${from} at ${ethers.formatEther(flowRate * 60n)} ETH/min`)
      
      // Start periodic withdrawal for this stream
      const withdrawInterval = setInterval(async () => {
        try {
          const owed = await this.streamManager.getOwed(from, myAddress)
          if (owed > 0n) {
            console.log(`💰 Auto-withdrawing ${ethers.formatEther(owed)} ETH from ${from}`)
            await this.streamManager.withdraw(from)
          }
        } catch (error) {
          console.error('Auto-withdraw failed:', error)
        }
      }, checkInterval)

      // Stop interval when stream is cancelled
      this.onStreamCancelled((cancelledFrom, cancelledTo) => {
        if (cancelledFrom === from && cancelledTo === myAddress) {
          clearInterval(withdrawInterval)
          console.log(`🛑 Stream from ${from} cancelled, stopping auto-withdraw`)
        }
      })
    })
  }

  private addEventListener(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  // Clean up event listeners
  removeAllListeners() {
    this.streamManager.removeAllListeners()
    this.eventListeners.clear()
  }
}
