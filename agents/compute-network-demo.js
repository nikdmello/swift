#!/usr/bin/env node

import { GPUAgent } from './gpu-agent.js'
import { StorageAgent } from './storage-agent.js'
import { ComputeAgent } from './compute-agent.js'
import { WorkflowAgent } from './workflow-agent.js'
import { readFileSync } from 'fs'

class ComputeNetworkDemo {
  constructor() {
    this.agents = []
    this.isRunning = false
    this.marketplaceAddress = '0x69Fc6F398670EA5b3248820a3b665db2f2502c83'
  }

  async startDemo() {
    console.log('SWIFT COMPUTE NETWORK')
    console.log('AUTONOMOUS AGENT COORDINATION FOR REAL COMPUTE')
    console.log('=' .repeat(60))

    const fundedAgents = JSON.parse(readFileSync('funded-agents.json', 'utf8'))
    
    const agentConfigs = [
      // Service Providers
      {
        type: 'gpu',
        name: 'GPUAgent',
        privateKey: fundedAgents[0].privateKey,
        services: ['text-generation', 'image-analysis'],
        prices: { 'text-generation': '0.000002', 'image-analysis': '0.000003' },
        interval: 30000
      },
      {
        type: 'storage',
        name: 'StorageAgent', 
        privateKey: fundedAgents[1].privateKey,
        services: ['ipfs-storage', 'data-backup'],
        prices: { 'ipfs-storage': '0.000001', 'data-backup': '0.000002' },
        interval: 35000
      },
      {
        type: 'compute',
        name: 'ComputeAgent',
        privateKey: fundedAgents[2].privateKey,
        services: ['data-processing', 'calculation'],
        prices: { 'data-processing': '0.000001', 'calculation': '0.000001' },
        interval: 40000
      },
      
      // Service Consumers (Workflow Orchestrators)
      {
        type: 'workflow',
        name: 'ContentAgent',
        privateKey: fundedAgents[3].privateKey,
        workflow: ['text-generation', 'ipfs-storage'], // Generate content, then store it
        providers: [fundedAgents[0].address, fundedAgents[1].address],
        interval: 45000
      },
      {
        type: 'workflow', 
        name: 'AnalyticsAgent',
        privateKey: fundedAgents[4].privateKey,
        workflow: ['data-processing', 'calculation', 'data-backup'], // Process data, calculate, backup
        providers: [fundedAgents[2].address, fundedAgents[1].address],
        interval: 50000
      }
    ]

    this.isRunning = true
    
    console.log('STARTING COMPUTE PROVIDERS...')
    
    for (let i = 0; i < agentConfigs.length; i++) {
      const agentConfig = { ...agentConfigs[i], marketplaceAddress: this.marketplaceAddress }
      let agent
      
      switch (agentConfig.type) {
        case 'gpu':
          agent = new GPUAgent(agentConfig)
          break
        case 'storage':
          agent = new StorageAgent(agentConfig)
          break
        case 'compute':
          agent = new ComputeAgent(agentConfig)
          break
        case 'workflow':
          agent = new WorkflowAgent(agentConfig)
          break
      }
      
      if (agent) {
        this.agents.push(agent)
        
        setTimeout(() => {
          if (this.isRunning) {
            agent.start()
          }
        }, i * 5000) // 5 second delays
        
        if (agentConfig.services) {
          console.log(`${agentConfig.name} - provides ${agentConfig.services.join(', ')}`)
        } else {
          console.log(`${agentConfig.name} - orchestrates ${agentConfig.workflow.join(' → ')}`)
        }
      }
    }

    console.log('\nAUTONOMOUS COMPUTE COORDINATION RUNNING!')
    console.log('Contract:', this.marketplaceAddress)
    console.log('Agents coordinate to complete real compute workflows')
    console.log('Press Ctrl+C to stop...')

    process.on('SIGINT', () => {
      this.stopDemo()
    })

    await new Promise(resolve => {
      process.on('SIGINT', resolve)
    })
  }

  stopDemo() {
    console.log('\nSTOPPING COMPUTE NETWORK...')
    this.isRunning = false
    
    this.agents.forEach(agent => agent.stop())
    
    console.log('All agents stopped')
    console.log('Compute coordination demo complete!')
    
    setTimeout(() => process.exit(0), 2000)
  }
}

const demo = new ComputeNetworkDemo()
demo.startDemo().catch(console.error)