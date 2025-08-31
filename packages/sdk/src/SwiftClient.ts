import { ethers } from 'ethers'
import type { InterfaceAbi } from 'ethers'
import StreamManagerArtifact from '../../../frontend/abis/StreamManager.json'

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
}
