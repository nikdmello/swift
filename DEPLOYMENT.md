# Production Deployment Guide

## Required Real Credentials

### 1. AWS Configuration
```bash
aws configure
# Enter your real AWS Access Key ID
# Enter your real AWS Secret Access Key
# Region: us-east-1
```

### 2. Hugging Face API Token
```bash
# Get real token from https://huggingface.co/settings/tokens
export HUGGING_FACE_TOKEN="hf_your_actual_token_here"
```

### 3. Funded Wallet Private Key
```bash
# Use wallet with real ETH on Base L2
export FUNDING_WALLET_KEY="your_actual_private_key_with_eth"
```

## Deployment Commands

```bash
# 1. Deploy infrastructure
./infrastructure/deploy.sh

# 2. Fund agents with real ETH
node agents/fund-agents.js

# 3. Start production network
source agents/production.env
node agents/production-network.js
```

## Cost Estimate
- EC2 instances: ~$50/month
- Load balancer: ~$20/month  
- Agent funding: ~0.1 ETH (~$300)
- API calls: ~$10/month

**Total: ~$380 initial + $80/month**