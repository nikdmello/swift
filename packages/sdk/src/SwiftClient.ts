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

  // Event methods disabled due to RPC filter issues - using polling instead

  // Pure polling approach to avoid RPC filter issues
  async startAutoWithdraw(checkInterval: number = 30000) {
    const myAddress = await this.signer.getAddress()
    console.log(`🔄 Starting polling-based auto-withdrawal for ${myAddress}`)
    await this.setupPollingMode(myAddress, checkInterval)
  }

  private async setupPollingMode(myAddress: string, checkInterval: number) {
    console.log('🔄 Using polling mode for stream detection')
    
    const checkForStreams = async () => {
      await this.checkExistingStreams(myAddress, checkInterval)
    }

    // Check immediately and then every interval
    await checkForStreams()
    setInterval(checkForStreams, checkInterval)
  }

  private async checkExistingStreams(myAddress: string, checkInterval: number) {
    // Check known senders for active streams
    const knownSenders = [
      '0xa6bA10f45a299E4790488CE5174bB8825c7F247d',
      '0xbAa5F677902381a98ddD9408E2cf90f0A7802B4f'
    ]

    for (const sender of knownSenders) {
      if (sender.toLowerCase() === myAddress.toLowerCase()) continue
      
      try {
        const stream = await this.streamManager.getStream(sender, myAddress)
        if (stream.active) {
          console.log(`🔍 Found active stream from ${sender}`)
          await this.startWithdrawalForStream(sender, myAddress, checkInterval)
        }
      } catch (error) {
        // Stream doesn't exist, continue
      }
    }
  }

  private async startWithdrawalForStream(from: string, to: string, checkInterval: number) {
    const withdrawalKey = `${from}-${to}`
    
    // Prevent duplicate intervals for the same stream
    if (this.eventListeners.has(withdrawalKey)) {
      return
    }

    const withdrawInterval = setInterval(async () => {
      try {
        const owed = await this.streamManager.getOwed(from, to)
        if (owed > 0n) {
          console.log(`💰 Auto-withdrawing ${ethers.formatEther(owed)} ETH from ${from}`)
          await this.streamManager.withdraw(from)
        }
      } catch (error) {
        console.error(`❌ Auto-withdraw failed from ${from}:`, error)
      }
    }, checkInterval)

    this.eventListeners.set(withdrawalKey, [() => clearInterval(withdrawInterval)])
  }

  private addEventListener(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  // Clean up event listeners and intervals
  removeAllListeners() {
    // Clear all intervals
    for (const [key, listeners] of this.eventListeners.entries()) {
      listeners.forEach(cleanup => cleanup())
    }
    this.eventListeners.clear()
    
    // Remove contract event listeners
    this.streamManager.removeAllListeners()
    console.log('🧹 Cleaned up all event listeners and intervals')
  }
}
