import { ethers } from 'ethers'
import { SwiftClient } from '@swift-protocol/sdk'

export class SimpleSwiftClient {
  private signer: ethers.Wallet
  private provider: ethers.JsonRpcProvider
  private swiftClient: SwiftClient

  constructor(signer: ethers.Wallet, provider: ethers.JsonRpcProvider) {
    this.signer = signer
    this.provider = provider
    
    const registryArtifact = require('../../../frontend/abis/AgentRegistry.json')
    const messengerArtifact = require('../../../frontend/abis/AgentMessenger.json')
    const registryAbi = registryArtifact.abi
    const messengerAbi = messengerArtifact.abi
    
    this.swiftClient = new SwiftClient(
      signer,
      provider,
      '0xF0d35A77e8EbeAe523ccC8df5bC7DAFE562DA1D8', // AgentRegistry
      '0x93B136204B1f3d5917c60C65748a2cda6A8F62c8', // AgentMessenger
      '0x4e37173B972E39D731b421c13922959dbfd97331', // StreamManager
      registryAbi,
      messengerAbi
    )
  }

  async registerAgent(): Promise<string> {
    return await this.swiftClient.registerAgent()
  }

  async isAgentRegistered(address: string): Promise<boolean> {
    return await this.swiftClient.isAgentRegistered(address)
  }
  
  // Expose SwiftClient for advanced features
  getSwiftClient(): SwiftClient {
    return this.swiftClient
  }

  async sendSwiftMessage(recipient: string, totalAmount: bigint, durationMinutes: number): Promise<void> {
    const amountPerMinute = totalAmount / BigInt(durationMinutes)
    const durationSeconds = durationMinutes * 60

    console.log('ℹ️  Creating escrow + streaming payment:')
    console.log({ 
      'escrowDeposit': `${ethers.formatEther(totalAmount)} ETH (immediate)`,
      'streamingRate': `${ethers.formatEther(amountPerMinute)} ETH/min`,
      'vestingPeriod': `${durationMinutes} minutes`,
      'note': 'Recipient can withdraw accumulated funds over time'
    })

    await this.swiftClient.sendSwiftMessage(recipient, totalAmount, durationSeconds)
    console.log('✅ Message sent with event-driven streaming!')
  }
}