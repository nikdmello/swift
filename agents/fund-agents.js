const { ethers } = require('ethers');

// Real funding script for production agents
async function fundProductionAgents() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    // Main funding wallet (requires manual funding with real ETH)
    const fundingWallet = new ethers.Wallet(process.env.FUNDING_WALLET_KEY, provider);
    
    const agents = require('./funded-agents.json');
    const fundingAmount = ethers.parseEther('0.01'); // 0.01 ETH per agent
    
    console.log('Funding production agents with real ETH...');
    console.log(`Funding wallet: ${fundingWallet.address}`);
    
    const balance = await provider.getBalance(fundingWallet.address);
    console.log(`Available balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < fundingAmount * BigInt(agents.length)) {
        throw new Error('Insufficient balance for funding all agents');
    }
    
    const transactions = [];
    
    for (const agent of agents) {
        try {
            console.log(`Funding agent ${agent.address}...`);
            
            const tx = await fundingWallet.sendTransaction({
                to: agent.address,
                value: fundingAmount,
                gasLimit: 21000
            });
            
            const receipt = await tx.wait();
            transactions.push({
                agent: agent.address,
                hash: receipt.hash,
                amount: ethers.formatEther(fundingAmount)
            });
            
            console.log(`✓ Funded ${agent.address}: ${receipt.hash}`);
            
        } catch (error) {
            console.error(`✗ Failed to fund ${agent.address}:`, error.message);
        }
    }
    
    // Verify funding
    console.log('\nVerifying agent balances...');
    for (const agent of agents) {
        const balance = await provider.getBalance(agent.address);
        console.log(`${agent.address}: ${ethers.formatEther(balance)} ETH`);
    }
    
    return transactions;
}

// Execute funding
if (require.main === module) {
    fundProductionAgents()
        .then(transactions => {
            console.log('\nFunding completed!');
            console.log(`Total transactions: ${transactions.length}`);
            console.log('Agents ready for production coordination.');
        })
        .catch(console.error);
}

module.exports = fundProductionAgents;