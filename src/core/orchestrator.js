import { ethers } from 'ethers';

export class WorkflowOrchestrator {
    constructor() {
        this.activeWorkflows = new Map();
        this.completedWorkflows = new Map();
        this.nextId = 1;
    }

    async createWorkflow(spec) {
        const { description, agents, deadline = Date.now() + 300000 } = spec;
        
        const workflowId = this.nextId++;
        const workflow = {
            id: workflowId,
            description,
            agents: agents.map(a => ({ ...a, completed: false, result: null })),
            status: 'PENDING',
            deadline,
            createdAt: Date.now()
        };

        this.activeWorkflows.set(workflowId, workflow);
        return workflowId;
    }

    async executeWorkflow(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

        workflow.status = 'EXECUTING';

        // Execute all agents in parallel
        const results = await Promise.allSettled(
            workflow.agents.map(agent => this.executeAgent(agent))
        );

        // Check if all succeeded
        const allSucceeded = results.every(r => r.status === 'fulfilled' && r.value.success);

        if (allSucceeded) {
            workflow.status = 'COMPLETED';
            results.forEach((result, i) => {
                workflow.agents[i].completed = true;
                workflow.agents[i].result = result.value.data;
            });

            this.completedWorkflows.set(workflowId, workflow);
            this.activeWorkflows.delete(workflowId);

            return {
                success: true,
                workflowId,
                results: workflow.agents.map(a => ({
                    service: a.service,
                    result: a.result
                }))
            };
        } else {
            workflow.status = 'FAILED';
            return {
                success: false,
                workflowId,
                errors: results.filter(r => r.status === 'rejected').map(r => r.reason.message)
            };
        }
    }

    async executeAgent(agent) {
        // Simulate service execution
        await this.delay(1000 + Math.random() * 2000);
        
        // 10% failure rate for demo
        if (Math.random() < 0.1) {
            throw new Error(`${agent.service} service failed`);
        }

        return {
            success: true,
            data: this.generateMockData(agent.service)
        };
    }

    generateMockData(service) {
        const mockData = {
            'MARKET_DATA': { price: 43250, volume: '2.1B', timestamp: Date.now() },
            'ML_ANALYSIS': { prediction: 'BULLISH', confidence: 0.85, timestamp: Date.now() },
            'RISK_ASSESSMENT': { score: 7.2, maxPosition: 0.3, timestamp: Date.now() },
            'EXECUTION': { orderId: `order_${Date.now()}`, status: 'FILLED', timestamp: Date.now() }
        };
        return mockData[service] || { result: 'completed', timestamp: Date.now() };
    }

    getWorkflowStatus(workflowId) {
        return this.activeWorkflows.get(workflowId) || this.completedWorkflows.get(workflowId);
    }

    getAllWorkflows() {
        return {
            active: Array.from(this.activeWorkflows.values()),
            completed: Array.from(this.completedWorkflows.values())
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}