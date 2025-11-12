export class SwiftClient {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:3000';
    }

    async executeWorkflow(spec) {
        const { description, agents } = spec;
        
        // Create workflow
        const createResponse = await fetch(`${this.apiUrl}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, agents })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create workflow: ${createResponse.statusText}`);
        }

        const { workflowId } = await createResponse.json();

        // Execute workflow
        const executeResponse = await fetch(`${this.apiUrl}/workflows/${workflowId}/execute`, {
            method: 'POST'
        });

        if (!executeResponse.ok) {
            throw new Error(`Failed to execute workflow: ${executeResponse.statusText}`);
        }

        return await executeResponse.json();
    }

    async getWorkflowStatus(workflowId) {
        const response = await fetch(`${this.apiUrl}/workflows/${workflowId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to get workflow status: ${response.statusText}`);
        }

        return await response.json();
    }

    // Predefined workflow templates
    async executeTradingWorkflow(symbol = 'BTC') {
        return await this.executeWorkflow({
            description: `Complete trading analysis for ${symbol}`,
            agents: [
                { service: 'MARKET_DATA' },
                { service: 'ML_ANALYSIS' },
                { service: 'RISK_ASSESSMENT' },
                { service: 'EXECUTION' }
            ]
        });
    }

    async executeAnalysisWorkflow(topic) {
        return await this.executeWorkflow({
            description: `Market analysis for ${topic}`,
            agents: [
                { service: 'MARKET_DATA' },
                { service: 'ML_ANALYSIS' }
            ]
        });
    }
}