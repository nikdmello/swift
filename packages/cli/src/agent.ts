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

  async startListening(intervalSeconds: number): Promise<void> {
    const address = await this.signer.getAddress()
    console.log(`🎧 Agent listening for messages: ${address}`)
    console.log(`⏰ Check interval: ${intervalSeconds}s`)

    const checkMessages = async () => {
      try {
        // Check for new messages and auto-withdraw
        await this.autoWithdraw()
      } catch (error) {
        console.error('❌ Error checking messages:', error)
      }
    }

    // Initial check
    await checkMessages()
    
    // Set up interval
    setInterval(checkMessages, intervalSeconds * 1000)
  }

  async autoWithdraw(): Promise<void> {
    console.log('🔍 Checking for withdrawable funds...')
    
    try {
      const streamManagerAbi = require('../../../frontend/abis/StreamManager.json').abi
      const streamManager = new ethers.Contract(
        '0x4e37173B972E39D731b421c13922959dbfd97331',
        streamManagerAbi,
        this.signer
      )
      
      const myAddress = await this.signer.getAddress()
      
      // Check for streams from known senders (simplified for demo)
      const senders = [
        '0xa6bA10f45a299E4790488CE5174bB8825c7F247d',
        '0xbAa5F677902381a98ddD9408E2cf90f0A7802B4f'
      ]
      
      for (const sender of senders) {
        if (sender.toLowerCase() === myAddress.toLowerCase()) continue
        
        try {
          // Check if there's an active stream
          const stream = await streamManager.getStream(sender, myAddress)
          if (stream.active) {
            console.log(`🌊 Active stream detected from ${sender}`)
            
            const owed = await streamManager.getOwed(sender, myAddress)
            if (owed > 0n) {
              console.log(`💰 Found ${ethers.formatEther(owed)} ETH from ${sender}`)
              console.log('🔄 Withdrawing funds...')
              
              const tx = await streamManager.withdraw(sender)
              await tx.wait()
              
              console.log(`✅ Withdrew ${ethers.formatEther(owed)} ETH! TX: ${tx.hash}`)
            } else {
              console.log(`⏳ Stream active but no funds accumulated yet from ${sender}`)
            }
          }
        } catch (err) {
          // Stream might not exist, continue
        }
      }
    } catch (error) {
      console.error('❌ Auto-withdraw failed:', error)
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