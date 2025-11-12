import express from 'express';
import cors from 'cors';
import { WorkflowOrchestrator } from './core/orchestrator.js';

const app = express();
app.use(cors());
app.use(express.json());

const orchestrator = new WorkflowOrchestrator();

// Create atomic workflow
app.post('/workflows', async (req, res) => {
    try {
        const { description, agents, deadline } = req.body;
        const workflowId = await orchestrator.createWorkflow({ description, agents, deadline });
        
        res.json({
            success: true,
            workflowId,
            message: `Workflow created: ${description}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Execute workflow
app.post('/workflows/:id/execute', async (req, res) => {
    try {
        const workflowId = parseInt(req.params.id);
        const result = await orchestrator.executeWorkflow(workflowId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workflow status
app.get('/workflows/:id', (req, res) => {
    try {
        const workflowId = parseInt(req.params.id);
        const workflow = orchestrator.getWorkflowStatus(workflowId);
        
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }
        
        res.json({ success: true, workflow });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'swift-orchestrator',
        timestamp: new Date().toISOString()
    });
});

// Metrics
app.get('/metrics', (req, res) => {
    const workflows = orchestrator.getAllWorkflows();
    
    res.json({
        totalWorkflows: workflows.active.length + workflows.completed.length,
        activeWorkflows: workflows.active.length,
        completedWorkflows: workflows.completed.length,
        successRate: workflows.completed.length > 0 ? 
            (workflows.completed.filter(w => w.status === 'COMPLETED').length / workflows.completed.length * 100).toFixed(1) + '%' : 
            '0%'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Swift Orchestrator');
    console.log(`Server: http://localhost:${PORT}`);
    console.log('Ready for atomic multi-agent coordination');
});