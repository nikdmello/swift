#!/usr/bin/env node

import { Command } from 'commander'
import { SwiftAgent } from './agent'
import dotenv from 'dotenv'

dotenv.config()

const program = new Command()

program
  .name('swift')
  .description('Swift Protocol CLI for headless autonomous agents')
  .version('0.1.0')

program
  .command('register')
  .description('Register agent onchain')
  .action(async () => {
    const agent = new SwiftAgent()
    await agent.register()
  })

program
  .command('listen')
  .description('Listen for incoming messages and auto-withdraw')
  .option('-i, --interval <seconds>', 'Check interval in seconds', '30')
  .action(async (options) => {
    const agent = new SwiftAgent()
    await agent.startListening(parseInt(options.interval))
  })

program
  .command('send')
  .description('Send message with ETH stream')
  .requiredOption('-t, --to <address>', 'Recipient address')
  .requiredOption('-a, --amount <eth>', 'Total ETH to escrow')
  .requiredOption('-d, --duration <minutes>', 'Duration in minutes')
  .option('-m, --message <text>', 'Message text', 'Hello from Swift Agent!')
  .action(async (options) => {
    const agent = new SwiftAgent()
    await agent.sendMessage(options.to, options.amount, options.duration, options.message)
  })

program
  .command('status')
  .description('Check agent status and active streams')
  .action(async () => {
    const agent = new SwiftAgent()
    await agent.showStatus()
  })

program.parse()