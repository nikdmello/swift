# Swift Protocol

**Swift Protocol** is payment infrastructure for autonomous agent economies. Inspired by SWIFT for banks, Swift enables AI agents to send **instant micro-payments** — all onchain and fully autonomous.

> **Proven at scale**: 14,000+ autonomous transactions on Base. Demonstrated "Stripe for AI agents" with 1000x+ cost reduction and 100% success rate.

## The Problem

AI agents can optimize individual tasks, but they can't coordinate with each other. This coordination gap costs billions annually in supply chains, financial markets, and climate action. Traditional payment rails make micro-transactions impossible — Stripe charges $0.30+ for a $0.003 agent payment.

## Features

- **Instant Payments** - Direct agent-to-agent transfers
- **Micro-transactions** - Viable payments as low as $0.003
- **High Frequency** - 20+ TPS sustained throughput
- **Autonomous Operation** - Zero human intervention required
- **Cost Efficient** - 1000x+ cheaper than traditional processors

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
| **AgentPayments.sol** | Simple payment contract (like Stripe API) |
| **GenericAgent** | Autonomous payment engine |
| **Swift CLI** | Headless agent automation |
| **Base** | Low-cost, high-speed settlement |

## How It Works

1. **Simple Payment**: `payAgent(to, service)` - one function call
2. **Instant Settlement**: Direct transfer, no escrow needed
3. **Autonomous Operation**: Agents continuously send micro-payments
4. **Cost Efficient**: $0.0003 per transaction vs Stripe's $0.329

```
Agent A ──[payAgent()]──> AgentPayments ──[instant]──> Agent B
         ↓ $0.0003 cost                    ↑ Immediate
    "Stripe for AI"                   "1000x Cheaper"
```

## Quick Start

### 1. Installation
```bash
git clone https://github.com/nikdmello/swift-protocol
cd swift-protocol
pnpm install
```

### 2. Environment Setup
```bash
# Copy and configure environment
cp .env.example .env
# Add your PRIVATE_KEY and RPC_URL
```

### 3. Deploy Contracts (Optional)
```bash
cd contracts
pnpm hardhat run scripts/deploy-agent-payments.js --network baseSepolia
```

### 4. Usage
```bash
# Deploy and use AgentPayments contract
# See contracts/contracts/AgentPayments.sol
```

## Production Results

**Proven Performance**: 10 concurrent agents generating 20+ TPS with micro-payments. Demonstrated with 14,000+ real transactions on Base Sepolia.

## Use Cases

- **Supply Chain Coordination** - Agents negotiate contracts and transfer payments across logistics networks
- **Financial Market Arbitrage** - High-frequency coordination between trading agents
- **Climate Action Networks** - Carbon credit trading and renewable energy coordination
- **Autonomous Manufacturing** - Real-time coordination between production agents
- **Smart City Infrastructure** - Traffic, energy, and resource optimization at scale

## Live Deployment (Base Sepolia)

- **AgentPayments**: [`0x2c13187b1A111d73DA834F5A8eb5247AEed3e9bA`](https://sepolia.basescan.org/address/0x2c13187b1A111d73DA834F5A8eb5247AEed3e9bA)
- **Transactions**: 14,000+ autonomous payments verified
- **Success Rate**: 100% (BaseScan verified)

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20, Hardhat
- **Agent Engine**: TypeScript, Ethers.js v6
- **CLI**: Node.js, TypeScript
- **Network**: Base Sepolia

## Project Structure

```
swift/
├── contracts/           # Smart contracts
│   ├── contracts/      # Solidity source files
│   └── scripts/       # Deployment scripts
├── packages/
│   └── cli/          # Autonomous agent CLI
└── README.md           # Documentation
```

## Core Contract

```solidity
// Simple payment function - like Stripe for AI agents
function payAgent(address to, string memory service) external payable
```

## License

MIT License - see [LICENSE](LICENSE) for details.
