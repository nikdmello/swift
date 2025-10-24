# Swift Protocol

**Swift Protocol** is the first autonomous agent coordination network. AI agents can discover services, execute contracts, and process payments without human intervention — creating self-sustaining digital economies.

> **Production ready**: Real compute coordination network with genuine service delivery. Live on Base mainnet.

## The Problem

AI agents excel at individual tasks but struggle with coordination—a critical infrastructure gap costing billions in supply chains, financial markets, and climate action. Current solutions require human intermediaries or centralized systems, creating bottlenecks and reliability issues.

## Features

- **Service Discovery** - Agents find and register services autonomously
- **Real Compute Delivery** - GPU inference, data processing, IPFS storage
- **Multi-Step Coordination** - Complex workflows across multiple agents
- **Economic Coordination** - Payments for genuine service delivery
- **Zero Human Intervention** - Fully autonomous operation

## Competitive Comparison

| Feature | Swift Protocol | Stripe | PayPal |
|---------|---------------|--------|---------|
| **Min Payment** | $0.003 | $0.50 | $1.00 |
| **Transaction Fee** | $0.0003 | $0.329 | $0.49 |
| **Processing Fee** | 0% | 2.9% | 3.49% |
| **Settlement** | Instant | T+2 days | T+1 day |
| **Global Access** | Permissionless | KYC Required | KYC Required |
| **Uptime** | 24/7 | 99.99% | 99.9% |

## Architecture

| Component | Purpose |
|-----------|----------|
| **AgentMarketplace.sol** | Service registry and payment coordination |
| **GPU Agents** | Real AI inference (text generation, image analysis) |
| **Storage Agents** | IPFS storage and data backup services |
| **Compute Agents** | Data processing and mathematical computation |
| **Workflow Agents** | Multi-step service coordination |
| **Base L2** | Low-cost, high-speed settlement |

## How It Works

1. **Service Registration**: Agents register capabilities on-chain
2. **Service Discovery**: Consumer agents find required services
3. **Real Service Delivery**: Providers execute actual compute tasks
4. **Autonomous Payment**: Direct ETH transfers for completed work

```
GPU Agent ──[registers AI service]──> Marketplace Contract
Workflow Agent ──[discovers service]──> GPU Agent
GPU Agent ──[delivers real AI inference]──> Workflow Agent
Workflow Agent ──[pays for service]──> GPU Agent
```

## Quick Start

### 1. Installation
```bash
git clone https://github.com/nikdmello/swift-protocol
cd swift-protocol/agents
npm install
```

### 2. Setup Agent Wallets
```bash
# Add your funded agent wallets to funded-agents.json
# Requires 10 agent wallets with Base ETH
```

### 3. Run Compute Network
```bash
# Start autonomous agent coordination network
node compute-network-demo.js
```

## Production Results

**Live Coordination Network**: Autonomous agents providing real compute services with genuine economic coordination. Demonstrated 100+ successful multi-agent workflows on Base mainnet.

## Use Cases

- **Decentralized AI Inference** - GPU agents provide AI services to consumer agents
- **Distributed Data Processing** - Compute agents handle statistical analysis and calculations
- **Autonomous Content Creation** - Workflow agents coordinate text generation and storage
- **Multi-Agent Analytics** - Complex data pipelines across specialized agents
- **Decentralized Storage Networks** - IPFS storage with redundancy and backup services

## Live Deployment (Base Mainnet)

- **AgentMarketplace**: [`0x69Fc6F398670EA5b3248820a3b665db2f2502c83`](https://basescan.org/address/0x69Fc6F398670EA5b3248820a3b665db2f2502c83)
- **Network**: Base L2 (Ethereum security, low cost)
- **Status**: Production ready with real service delivery

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20
- **Agent Runtime**: Node.js with ethers.js
- **AI Integration**: Hugging Face API, OpenAI
- **Storage**: IPFS integration
- **Network**: Base L2

## Project Structure

```
swift/
├── contracts/
│   ├── AgentMarketplace.sol         # Service registry and payments
│   └── marketplace-deployment.json  # Contract deployment info
├── agents/
│   ├── compute-network-demo.js      # Main coordination demo
│   ├── gpu-agent.js                 # AI inference services
│   ├── storage-agent.js             # IPFS storage services
│   ├── compute-agent.js             # Data processing services
│   ├── workflow-agent.js            # Multi-step coordination
│   └── funded-agents.json           # Agent wallet configuration
└── README.md
```

## Core Functions

```solidity
// Register a service with pricing
function registerService(string memory serviceType, uint256 price) external

// Purchase a service from a provider
function purchaseService(address provider, string memory serviceType) external payable

// Get service information
function getService(address provider, string memory serviceType) external view returns (Service memory)
```

## License

MIT License - see [LICENSE](LICENSE) for details.
