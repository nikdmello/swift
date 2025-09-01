import { ethers } from 'ethers'
import { SimpleSwiftClient } from './simple-client'

export class SwiftAgent {
  private client: SimpleSwiftClient
  private signer: ethers.Wallet
  private provider: ethers.JsonRpcProvider

  constructor() {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable required')
    }
    if (!process.env.RPC_URL) {
      throw new Error('RPC_URL environment variable required')
    }

    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
    this.client = new SimpleSwiftClient(this.signer, this.provider)
  }

  async register(): Promise<void> {
    console.log('🤖 Registering agent...')
    try {
      const address = await this.signer.getAddress()
      const isRegistered = await this.client.isAgentRegistered(address)
      
      if (isRegistered) {
        console.log('✅ Agent already registered:', address)
        return
      }

      const txHash = await this.client.registerAgent()
      console.log('✅ Agent registered! TX:', txHash)
    } catch (error) {
      console.error('❌ Registration failed:', error)
    }
  }

  async startListening(intervalSeconds: number = 30): Promise<void> {
    const address = await this.signer.getAddress()
    console.log(`🎧 Agent listening for events: ${address}`)
    console.log(`🔄 Event-driven mode with ${intervalSeconds}s auto-withdraw interval`)

    try {
      // Start event-driven auto-withdrawal using enhanced SwiftClient
      await this.client.getSwiftClient().startAutoWithdraw(intervalSeconds * 1000)
      
      // Set up additional event listeners for logging
      const swiftClient = this.client.getSwiftClient()
      
      swiftClient.onStreamOpened((from: string, to: string, flowRate: bigint) => {
        if (to.toLowerCase() === address.toLowerCase()) {
          console.log(`🎆 Stream opened from ${from}: ${ethers.formatEther(flowRate * 60n)} ETH/min`)
        }
      })

      swiftClient.onWithdrawn((to: string, from: string, amount: bigint) => {
        if (to.toLowerCase() === address.toLowerCase()) {
          console.log(`✅ Withdrew ${ethers.formatEther(amount)} ETH from ${from}`)
        }
      })

      swiftClient.onStreamCancelled((from: string, to: string, refunded: bigint) => {
        if (to.toLowerCase() === address.toLowerCase()) {
          console.log(`🛑 Stream from ${from} cancelled`)
        }
      })

      console.log('✨ Event listeners active - agent is now fully autonomous!')
      
      // Keep the process alive
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down agent...')
        this.client.getSwiftClient().removeAllListeners()
        process.exit(0)
      })
      
    } catch (error) {
      console.error('❌ Failed to start event listening:', error)
    }
  }



  async sendMessage(to: string, amount: string, duration: string, message: string): Promise<void> {
    const durationMinutes = parseInt(duration)
    const totalAmount = ethers.parseEther(amount)
    const ratePerMinute = totalAmount / BigInt(durationMinutes)
    
    console.log(`📤 Sending message to ${to}`)
    console.log(`💵 Escrow deposit: ${amount} ETH (immediate)`)
    console.log(`⏱ Vesting period: ${durationMinutes} minutes`)
    console.log(`💰 Streaming rate: ${ethers.formatEther(ratePerMinute)} ETH/min`)
    
    try {
      await this.client.sendSwiftMessage(to, totalAmount, durationMinutes)
      console.log('✅ Message sent!')
    } catch (error) {
      console.error('❌ Send failed:', error)
    }
  }

  async showStatus(): Promise<void> {
    const address = await this.signer.getAddress()
    const balance = await this.provider.getBalance(address)
    const isRegistered = await this.client.isAgentRegistered(address)
    
    console.log('🤖 Swift Agent Status')
    console.log('━━━━━━━━━━━━━━━━━━━━')
    console.log(`Address: ${address}`)
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`)
    console.log(`Registered: ${isRegistered ? '✅' : '❌'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━')
  }
}