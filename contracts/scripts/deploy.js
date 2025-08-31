require('dotenv').config()
const hre = require('hardhat')
const fs = require('fs')
const path = require('path')
const { ethers } = hre

async function main() {
  const network = hre.network.name
  console.log(`🚀 Deploying to ${network}...`)

  let wallet
  if (network === 'localhost' || network === 'hardhat') {
    // Use Hardhat's default accounts for local development
    const [signer] = await ethers.getSigners()
    wallet = signer
  } else {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('❌ PRIVATE_KEY not found in .env')
    }
    const provider = new ethers.JsonRpcProvider(hre.network.config.url)
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  }

  // Deploy StreamManager first
  const StreamManager = await ethers.getContractFactory('StreamManager', wallet)
  const streamManager = await StreamManager.deploy()
  await streamManager.waitForDeployment()
  const streamManagerAddress = await streamManager.getAddress()
  console.log('✅ StreamManager deployed to:', streamManagerAddress)

  // Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry', wallet)
  const agentRegistry = await AgentRegistry.deploy()
  await agentRegistry.waitForDeployment()
  const registryAddress = await agentRegistry.getAddress()
  console.log('✅ AgentRegistry deployed to:', registryAddress)

  // Deploy AgentMessenger with registry + stream manager
  const AgentMessenger = await ethers.getContractFactory('AgentMessenger', wallet)
  const agentMessenger = await AgentMessenger.deploy(registryAddress, streamManagerAddress)
  await agentMessenger.waitForDeployment()
  const messengerAddress = await agentMessenger.getAddress()
  console.log('✅ AgentMessenger deployed to:', messengerAddress)

  const addresses = {
    AGENT_REGISTRY_ADDRESS: registryAddress,
    AGENT_MESSENGER_ADDRESS: messengerAddress,
    STREAM_MANAGER_ADDRESS: streamManagerAddress,
  }

  const filePath = path.join(__dirname, '../../frontend/lib/addresses.json')
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2))
  console.log('📦 Saved addresses to frontend/lib/addresses.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})