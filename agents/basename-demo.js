import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import express from 'express';
import cors from 'cors';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const agents = JSON.parse(readFileSync('./funded-agents.json', 'utf8'));
const CONTRACT_ADDRESS = '0x69Fc6F398670EA5b3248820a3b665db2f2502c83';

const app = express();
app.use(cors());
app.use(express.json());

const events = [];
const providerStats = {};



const PROVIDERS = [
    { index: 1, service: 'COMPUTE', basePrice: 0.00001, reputation: 0, name: 'compute-fast' },
    { index: 2, service: 'COMPUTE', basePrice: 0.000008, reputation: 0, name: 'compute-cheap' },
    { index: 3, service: 'STORAGE', basePrice: 0.000012, reputation: 0, name: 'storage-reliable' },
    { index: 4, service: 'STORAGE', basePrice: 0.00001, reputation: 0, name: 'storage-budget' }
];

const CONSUMERS = [
    { index: 0, budget: 0.0001, strategy: 'cheapest', name: 'consumer-alpha' }
];

class CoordinationNetwork {
    constructor() {
        PROVIDERS.forEach(p => {
            providerStats[agents[p.index].address] = {
                service: p.service,
                name: p.name,
                completedJobs: 0,
                earnings: 0,
                currentPrice: p.basePrice,
                reputation: 0
            };
        });
    }

    async providerPriceDiscovery(providerIndex) {
        const p = PROVIDERS[providerIndex];
        const wallet = new ethers.Wallet(agents[p.index].privateKey, provider);
        const stats = providerStats[wallet.address];
        
        const demandFactor = stats.completedJobs > 5 ? 1.2 : 0.9;
        const newPrice = p.basePrice * demandFactor;
        
        stats.currentPrice = newPrice;
        
        events.push({
            type: 'PRICE_ADJUSTMENT',
            provider: wallet.address,
            providerName: p.name,
            service: p.service,
            oldPrice: p.basePrice,
            newPrice,
            reason: `Demand-based pricing (${stats.completedJobs} jobs)`,
            timestamp: Date.now()
        });
    }

    async consumerDiscovery(consumerIndex, serviceType) {
        const consumer = CONSUMERS[consumerIndex];
        const wallet = new ethers.Wallet(agents[consumer.index].privateKey, provider);
        
        const availableProviders = PROVIDERS
            .filter(p => p.service === serviceType)
            .map(p => ({
                ...p,
                address: agents[p.index].address,
                stats: providerStats[agents[p.index].address]
            }));
        
        let selected;
        if (consumer.strategy === 'cheapest') {
            selected = availableProviders.sort((a, b) => a.stats.currentPrice - b.stats.currentPrice)[0];
        } else if (consumer.strategy === 'reliable') {
            selected = availableProviders.sort((a, b) => b.stats.reputation - a.stats.reputation)[0];
        } else {
            selected = availableProviders[0];
        }
        
        events.push({
            type: 'PROVIDER_SELECTED',
            consumer: wallet.address,
            consumerName: consumer.name,
            provider: selected.address,
            providerName: selected.name,
            service: serviceType,
            strategy: consumer.strategy,
            price: selected.stats.currentPrice,
            alternatives: availableProviders.length - 1,
            timestamp: Date.now()
        });
        
        return selected;
    }

    async executeCoordinatedWorkflow(consumerIndex) {
        const consumer = CONSUMERS[consumerIndex];
        const wallet = new ethers.Wallet(agents[consumer.index].privateKey, provider);
        
        const computeProvider = await this.consumerDiscovery(consumerIndex, 'COMPUTE');
        const computeResult = Math.floor(Math.random() * 1000);
        
        await this.executePayment(wallet, consumer.name, computeProvider.address, computeProvider.name, computeProvider.stats.currentPrice, 'COMPUTE');
        
        const storageProvider = await this.consumerDiscovery(consumerIndex, 'STORAGE');
        await this.executePayment(wallet, consumer.name, storageProvider.address, storageProvider.name, storageProvider.stats.currentPrice, 'STORAGE');
        
        const maxComputePrice = Math.max(...PROVIDERS.filter(p => p.service === 'COMPUTE').map(p => providerStats[agents[p.index].address].currentPrice));
        const maxStoragePrice = Math.max(...PROVIDERS.filter(p => p.service === 'STORAGE').map(p => providerStats[agents[p.index].address].currentPrice));
        const worstCaseCost = maxComputePrice + maxStoragePrice;
        const actualCost = computeProvider.stats.currentPrice + storageProvider.stats.currentPrice;
        const savings = worstCaseCost - actualCost;
        const savingsPercent = (savings / worstCaseCost * 100).toFixed(1);
        
        console.log(`Workflow: ${actualCost.toFixed(8)} ETH (saved ${savingsPercent}%)`);
        
        events.push({
            type: 'WORKFLOW_COMPLETED',
            consumer: wallet.address,
            consumerName: consumer.name,
            services: ['COMPUTE', 'STORAGE'],
            providers: [computeProvider.address, storageProvider.address],
            providerNames: [computeProvider.name, storageProvider.name],
            totalCost: actualCost,
            worstCaseCost,
            savings,
            savingsPercent,
            timestamp: Date.now()
        });
    }

    async executePayment(wallet, fromName, providerAddress, toName, amount, service) {
        const feeData = await provider.getFeeData();
        
        const tx = await wallet.sendTransaction({
            to: providerAddress,
            value: ethers.parseEther(amount.toString()),
            gasLimit: 21000,
            maxFeePerGas: feeData.maxFeePerGas * 3n,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 3n
        });
        
        const receipt = await tx.wait();
        console.log(`Payment: ${amount.toFixed(8)} ETH`);
        console.log(`TX: https://basescan.org/tx/${receipt.hash}`);
        
        const stats = providerStats[providerAddress];
        stats.completedJobs++;
        stats.earnings += amount;
        stats.reputation++;
        
        events.push({
            type: 'PAYMENT_COMPLETED',
            from: wallet.address,
            fromName,
            to: providerAddress,
            toName,
            amount,
            service,
            tx: receipt.hash,
            timestamp: Date.now()
        });
        
        await new Promise(r => setTimeout(r, 1000));
    }

    async runCoordinationCycle() {
        for (let i = 0; i < PROVIDERS.length; i++) {
            await this.providerPriceDiscovery(i);
        }
        
        await new Promise(r => setTimeout(r, 2000));
        
        const consumerIndex = Math.floor(Math.random() * CONSUMERS.length);
        await this.executeCoordinatedWorkflow(consumerIndex);
        
        await new Promise(r => setTimeout(r, 3000));
    }

    async run() {
        while (true) {
            await this.runCoordinationCycle();
        }
    }
}

app.get('/events', (req, res) => {
    res.json(events.slice(-50));
});

app.get('/stats', (req, res) => {
    res.json({
        providers: providerStats,
        totalEvents: events.length,
        workflows: events.filter(e => e.type === 'WORKFLOW_COMPLETED').length,
        payments: events.filter(e => e.type === 'PAYMENT_COMPLETED').length
    });
});

app.listen(3001, () => {
    console.log('API: http://localhost:3001');
});

const network = new CoordinationNetwork();
console.log('Swift - Coordination Network');
console.log('API: http://localhost:3001');
console.log('Dashboard: ../dashboard/live-demo.html\n');

await network.run();
