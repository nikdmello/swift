# Swift Protocol

**Swift Protocol** is infrastructure for autonomous agent economies. Inspired by SWIFT for banks, Swift enables AI agents to **register identities**, **coordinate messages**, and **stream ETH payments** — all onchain and fully autonomous.

> **Achievement**: Demonstrated autonomous agent-to-agent payment with zero human intervention. Agent A programmatically sent ETH streams to Agent B, which automatically detected and withdrew funds continuously.

## Features

- **Onchain Agent Registry** - Trustless identity verification
- **Message Coordination** - Agent-to-agent communication
- **Streaming Payments** - Real-time ETH flow with escrow security
- **Autonomous Operation** - Headless CLI for continuous agent control
- **Instant Settlement** - Recipients withdraw accumulated funds anytime

## Architecture

| Component | Purpose |
|-----------|----------|
| **AgentRegistry.sol** | Onchain identity verification |
| **AgentMessenger.sol** | Message + payment coordination |
| **StreamManager.sol** | Escrow-based streaming engine |
| **SwiftClient SDK** | TypeScript integration library |
| **Swift CLI** | Headless agent automation |

## How It Works

1. **Escrow Deposit**: Sender locks full payment upfront (security guarantee)
2. **Streaming Withdrawal**: Recipient earns funds over time based on elapsed duration
3. **Autonomous Settlement**: Agents automatically detect and withdraw accumulated earnings
4. **Trustless Operation**: Pure smart contract logic, no intermediaries

```
Agent A ──[0.001 ETH over 10min]──> StreamManager ──[Real-time]──> Agent B
         ↓ Immediate Escrow                           ↑ Auto-Withdraw
    "Payment Guaranteed"                        "Earn Over Time"
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
pnpm hardhat run scripts/deploy.js --network baseSepolia
```

### 4. Run Frontend Demo
```bash
cd frontend
pnpm dev
# Visit http://localhost:3000
```

### 5. Autonomous Agent CLI
```bash
cd packages/cli

# Register agent onchain
pnpm dev register

# Start autonomous listener (auto-withdraws earnings)
pnpm dev listen --interval 30

# Send payment stream to another agent
pnpm dev send --to 0x... --amount 0.001 --duration 10
```

## Autonomous Demo

**Terminal 1 - Autonomous Receiver:**
```bash
cd packages/cli
cp .env.agent1 .env
pnpm dev listen --interval 30
```

**Terminal 2 - Programmatic Sender:**
```bash
cp .env.agent2 .env
pnpm dev send --to AGENT1_ADDRESS --amount 0.001 --duration 5
```

**Result**: Agent 1 automatically detects incoming stream and withdraws accumulated funds every 30 seconds!

## Live Deployment (Base Sepolia)

- **AgentRegistry**: [`0xF0d35A77e8EbeAe523ccC8df5bC7DAFE562DA1D8`](https://sepolia.basescan.org/address/0xF0d35A77e8EbeAe523ccC8df5bC7DAFE562DA1D8)
- **AgentMessenger**: [`0x93B136204B1f3d5917c60C65748a2cda6A8F62c8`](https://sepolia.basescan.org/address/0x93B136204B1f3d5917c60C65748a2cda6A8F62c8)
- **StreamManager**: [`0x4e37173B972E39D731b421c13922959dbfd97331`](https://sepolia.basescan.org/address/0x4e37173B972E39D731b421c13922959dbfd97331)

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20, Hardhat
- **Frontend**: Next.js 14, Wagmi v2, RainbowKit v2, Tailwind CSS
- **SDK**: TypeScript, Ethers.js v6
- **CLI**: Node.js, TypeScript
- **Network**: Base Sepolia (L2)

## Project Structure

```
swift/
├── contracts/           # Smart contracts
│   ├── contracts/      # Solidity source files
│   └── scripts/       # Deployment scripts
├── frontend/           # Next.js web app
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   └── abis/         # Contract ABIs
├── packages/
│   ├── sdk/          # TypeScript SDK
│   └── cli/          # Headless agent CLI
└── docs/             # Documentation
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `pnpm dev register` | Register agent onchain |
| `pnpm dev status` | Check agent balance & registration |
| `pnpm dev listen --interval 30` | Auto-withdraw mode (autonomous) |
| `pnpm dev send --to 0x... --amount 0.001 --duration 10` | Send payment stream |

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**For the complete vision and roadmap, see [VISION.md](VISION.md)**