import { ethers } from 'ethers'

export class SimpleSwiftClient {
  private signer: ethers.Wallet
  private provider: ethers.JsonRpcProvider
  private agentRegistry: ethers.Contract

  constructor(signer: ethers.Wallet, provider: ethers.JsonRpcProvider) {
    this.signer = signer
    this.provider = provider
    
    const registryAbi = require('../../../frontend/abis/AgentRegistry.json').abi
    this.agentRegistry = new ethers.Contract(
      '0xF0d35A77e8EbeAe523ccC8df5bC7DAFE562DA1D8',
      registryAbi,
      signer
    )
  }

  async registerAgent(): Promise<string> {
    const tx = await this.agentRegistry.registerAgent()
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Transaction failed')
    }
    return tx.hash!
  }

  async isAgentRegistered(address: string): Promise<boolean> {
    return await this.agentRegistry.isAgentRegistered(address)
  }

  async sendSwiftMessage(recipient: string, totalAmount: bigint, durationMinutes: number): Promise<void> {
    // Check and cancel existing stream first
    try {
      const streamManagerAbi = require('../../../frontend/abis/StreamManager.json').abi
      const streamManager = new ethers.Contract(
        '0x4e37173B972E39D731b421c13922959dbfd97331',
        streamManagerAbi,
        this.signer
      )
      
      const existingStream = await streamManager.getStream(await this.signer.getAddress(), recipient)
      if (existingStream.active) {
        console.log('🔄 Cancelling existing stream...')
        const cancelTx = await streamManager.cancelStream(recipient)
        await cancelTx.wait()
        console.log('✅ Existing stream cancelled')
      }
    } catch (err) {
      console.log('ℹ️ No existing stream to cancel')
    }

    const messengerAbi = require('../../../frontend/abis/AgentMessenger.json').abi
    const agentMessenger = new ethers.Contract(
      '0x93B136204B1f3d5917c60C65748a2cda6A8F62c8',
      messengerAbi,
      this.signer
    )

    const amountPerMinute = totalAmount / BigInt(durationMinutes)

    console.log('ℹ️  Creating escrow + streaming payment:')
    console.log({ 
      'escrowDeposit': `${ethers.formatEther(totalAmount)} ETH (immediate)`,
      'streamingRate': `${ethers.formatEther(amountPerMinute)} ETH/min`,
      'vestingPeriod': `${durationMinutes} minutes`,
      'note': 'Recipient can withdraw accumulated funds over time'
    })

    const tx = await agentMessenger.sendMessageWithStream(
      recipient,
      'text',
      JSON.stringify({ body: 'Hello from Swift Agent!' }),
      amountPerMinute,
      durationMinutes,
      { value: totalAmount } // Full escrow deposit upfront
    )

    console.log('✅ tx hash:', tx.hash)
    await tx.wait()
  }
}