#!/usr/bin/env node

import { ethers } from 'ethers'

interface AgentConfig {
  name: string
  privateKey: string
  serviceType: string
  interval: number // milliseconds
  paymentAmount: string // ETH
  recipients: string[]
}

class GenericAgent {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private config: AgentConfig
  private isRunning = false
  private txCount = 0
  private successCount = 0
  private failureCount = 0
  private currentNonce: number = 0

  constructor(config: AgentConfig) {
    this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org')
    this.wallet = new ethers.Wallet(config.privateKey, this.provider)
    this.config = config
  }

  async start(): Promise<void> {
    console.log(`${this.config.name.toUpperCase()} STARTING`)
    console.log(`Address: ${this.wallet.address}`)
    console.log(`Service: ${this.config.serviceType} | Interval: ${this.config.interval}ms`)
    console.log(`Payment: ${this.config.paymentAmount} ETH to ${this.config.recipients.length} recipients`)

    this.isRunning = true
    
    await this.runServiceLoop()
  }

  async runServiceLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Generate service data
        const serviceData = this.generateServiceData()
        
        // Send payments to all recipients in parallel
        const promises = this.config.recipients.map(recipient => 
          this.sendPayment(recipient, serviceData)
        )
        await Promise.allSettled(promises)

        const successRate = this.txCount > 0 ? ((this.successCount / this.txCount) * 100).toFixed(1) : '0'
        console.log(`${this.config.name}: ${this.successCount}/${this.txCount} TXs (${successRate}%) | ${serviceData}`)
        
        // Wait for next cycle
        await new Promise(resolve => setTimeout(resolve, this.config.interval))
        
      } catch (error) {
        console.log(`${this.config.name} error: ${error}`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  private generateServiceData(): string {
    // Generate different data based on service type
    switch (this.config.serviceType) {
      case 'weather':
        return `${(20 + Math.random() * 15).toFixed(1)}°C`
      case 'crypto':
        return `BTC$${(45000 + Math.random() * 5000).toFixed(0)}`
      case 'stock':
        return `AAPL$${(150 + Math.random() * 20).toFixed(2)}`
      case 'news':
        return `sentiment:${(Math.random() > 0.5 ? 'positive' : 'negative')}`
      case 'sports':
        return `score:${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 5)}`
      case 'energy':
        return `oil$${(70 + Math.random() * 10).toFixed(2)}`
      case 'social':
        return `trend:${Math.random() > 0.5 ? 'bullish' : 'bearish'}`
      case 'iot':
        return `temp:${(22 + Math.random() * 8).toFixed(1)}C`
      case 'risk':
        return `risk:${(Math.random() * 100).toFixed(1)}%`
      default:
        return `data:${Math.random().toFixed(4)}`
    }
  }

  private async sendPayment(recipient: string, serviceData: string): Promise<void> {
    try {
      const paymentAbi = [
        'function payAgent(address to, string memory service) external payable'
      ]
      
      const payments = new ethers.Contract(
        '0x2c13187b1A111d73DA834F5A8eb5247AEed3e9bA',
        paymentAbi,
        this.wallet
      )
      
      const payment = ethers.parseEther(this.config.paymentAmount)
      const service = `${this.config.serviceType}:${serviceData}`
      
      // Get fresh nonce for each transaction
      const nonce = await this.provider.getTransactionCount(this.wallet.address)
      
      const tx = await payments.payAgent(
        recipient,
        service,
        { 
          value: payment,
          gasLimit: 100000,
          nonce: nonce
        }
      )
      
      this.txCount++
      this.successCount++
      console.log(`${this.config.name} TX: ${tx.hash}`)
      
    } catch (error) {
      this.txCount++
      this.failureCount++
      console.log(`${this.config.name} FAILED: ${error.message?.slice(0, 50)}...`)
    }
  }

  stop(): void {
    console.log(`${this.config.name} stopping...`)
    this.isRunning = false
  }
}

export { GenericAgent, AgentConfig }