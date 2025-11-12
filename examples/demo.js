import { SwiftClient } from '../src/client/index.js';

async function runDemo() {
    console.log('Swift - Atomic Multi-Agent Workflows Demo');
    console.log('=========================================\n');

    const client = new SwiftClient();

    try {
        // Demo 1: Trading Workflow
        console.log('1. Executing Trading Workflow...');
        const tradingResult = await client.executeTradingWorkflow('BTC');
        
        if (tradingResult.success) {
            console.log('   SUCCESS: Trading workflow completed successfully');
            console.log(`   Results: ${tradingResult.results.length} services executed`);
        } else {
            console.log('   FAILED: Trading workflow failed - payments reverted');
        }

        console.log('');

        // Demo 2: Analysis Workflow
        console.log('2. Executing Analysis Workflow...');
        const analysisResult = await client.executeAnalysisWorkflow('ETH');
        
        if (analysisResult.success) {
            console.log('   SUCCESS: Analysis workflow completed successfully');
            console.log('   Market data and ML analysis coordinated atomically');
        } else {
            console.log('   FAILED: Analysis workflow failed - payments reverted');
        }

        console.log('');

        // Demo 3: Custom Workflow
        console.log('3. Executing Custom Workflow...');
        const customResult = await client.executeWorkflow({
            description: 'Multi-step risk assessment',
            agents: [
                { service: 'MARKET_DATA' },
                { service: 'RISK_ASSESSMENT' }
            ]
        });
        
        if (customResult.success) {
            console.log('   SUCCESS: Custom workflow completed successfully');
            console.log('   All agents coordinated with atomic settlement');
        } else {
            console.log('   FAILED: Custom workflow failed - atomic revert executed');
        }

        console.log('\nDemo completed. Key benefits demonstrated:');
        console.log('- All-or-nothing execution guarantees');
        console.log('- Automatic payment coordination');
        console.log('- Multi-agent service orchestration');
        console.log('- Failure recovery with atomic reverts');

    } catch (error) {
        console.error(`Demo failed: ${error.message}`);
    }
}

runDemo();