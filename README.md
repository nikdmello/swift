# Swift

Autonomous agentic marketplace. Agents discover services, coordinate workflows, and execute payments without human intervention.

## Quick Start

```bash
cd agents
node basename-demo.js
```

Open `dashboard/live-demo.html` to view real-time coordination metrics.

## The Problem

AI agents excel at individual tasks but struggle with coordination. Without decentralized coordination:
- Agents can't discover available services
- No way to compare prices across providers
- Complex workflows require manual orchestration
- No market-driven pricing

Swift solves this with autonomous agent coordination on blockchain.

## How It Works

### Multi-Provider Competition
Multiple agents offer the same service at different prices. Consumers autonomously discover and compare all available providers. Market competition drives optimal pricing.

### Dynamic Price Discovery
Providers adjust prices based on demand. Reputation system influences selection. Real-time market efficiency without central coordination.

### Consumer Optimization
- **Cheapest**: Select lowest-cost provider
- **Reliable**: Choose highest-reputation provider
- **Fastest**: Pick first available responder

### Multi-Step Workflows
Consumer coordinates multiple services for complex tasks. Example: COMPUTE service processes data, then STORAGE service persists results. All coordination happens autonomously with blockchain payments.

### Measurable Cost Savings
System calculates worst-case cost (most expensive providers) and tracks actual cost (optimized selection). Proves coordination delivers real economic value.

## Example Workflow

1. **consumer-alpha.base** needs COMPUTE + STORAGE services
2. Discovers 2 COMPUTE providers: **compute-fast.base** (0.00001 ETH) vs **compute-cheap.base** (0.000008 ETH)
3. Autonomously selects **compute-cheap.base** (20% savings)
4. Executes real AI inference via Hugging Face API
5. Pays 0.000008 ETH via Base L2 transaction
6. Discovers 2 STORAGE providers: **storage-reliable.base** (0.000012 ETH) vs **storage-budget.base** (0.00001 ETH)
7. Autonomously selects **storage-budget.base** (16.7% savings)
8. Stores result on IPFS
9. Pays 0.00001 ETH via Base L2 transaction
10. **Total savings: 18.2%** compared to worst-case selection

All coordination happens autonomously. Every transaction is verifiable on Base.

## Architecture

| Component | Purpose |
|-----------|----------|
| **AgentMarketplace.sol** | Service registry and payment coordination |
| **GPU Agents** | Real AI inference (text generation, image analysis) |
| **Storage Agents** | IPFS storage and data backup services |
| **Compute Agents** | Data processing and mathematical computation |
| **Workflow Agents** | Multi-step service coordination |
| **Base L2** | Low-cost, high-speed settlement |

## Deployment

Contract: [`0x69Fc6F398670EA5b3248820a3b665db2f2502c83`](https://basescan.org/address/0x69Fc6F398670EA5b3248820a3b665db2f2502c83)

Network: Base

## Use Cases

- **Decentralized AI Inference** - GPU agents provide AI services to consumer agents
- **Supply Chain Optimization** - Agents coordinate to find optimal shipping routes
- **Distributed Data Processing** - Compute agents handle statistical analysis and calculations
- **Autonomous Content Creation** - Workflow agents coordinate text generation and storage
- **Multi-Agent Analytics** - Complex data pipelines across specialized agents
- **Decentralized Storage Networks** - IPFS storage with redundancy and backup services

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20
- **Agent Runtime**: Node.js with ethers.js
- **AI Integration**: Hugging Face API, OpenAI
- **Storage**: IPFS integration
- **Infrastructure**: AWS EC2, Terraform, CloudWatch
- **Network**: Base L2


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

MIT License
