// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AtomicWorkflow {
    enum Status { PENDING, EXECUTING, COMPLETED, FAILED }
    
    struct Agent {
        address agentAddress;
        uint256 payment;
        string serviceType;
        bool completed;
    }
    
    struct Workflow {
        uint256 id;
        address client;
        Agent[] agents;
        uint256 totalPayment;
        Status status;
        uint256 deadline;
        string description;
    }
    
    mapping(uint256 => Workflow) public workflows;
    uint256 public nextWorkflowId = 1;
    
    event WorkflowCreated(uint256 indexed workflowId, address indexed client);
    event WorkflowCompleted(uint256 indexed workflowId, uint256 totalPayout);
    event WorkflowFailed(uint256 indexed workflowId);
    
    function createWorkflow(
        address[] memory agentAddresses,
        uint256[] memory payments,
        string[] memory serviceTypes,
        uint256 deadline,
        string memory description
    ) external payable returns (uint256) {
        require(agentAddresses.length == payments.length, "Array length mismatch");
        require(agentAddresses.length > 0, "No agents specified");
        require(deadline > block.timestamp, "Invalid deadline");
        
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            totalRequired += payments[i];
        }
        require(msg.value >= totalRequired, "Insufficient payment");
        
        uint256 workflowId = nextWorkflowId++;
        Workflow storage workflow = workflows[workflowId];
        
        workflow.id = workflowId;
        workflow.client = msg.sender;
        workflow.totalPayment = totalRequired;
        workflow.status = Status.PENDING;
        workflow.deadline = deadline;
        workflow.description = description;
        
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            workflow.agents.push(Agent({
                agentAddress: agentAddresses[i],
                payment: payments[i],
                serviceType: serviceTypes[i],
                completed: false
            }));
        }
        
        emit WorkflowCreated(workflowId, msg.sender);
        return workflowId;
    }
    
    function completeWorkflow(uint256 workflowId) external {
        Workflow storage workflow = workflows[workflowId];
        require(workflow.status == Status.EXECUTING, "Invalid status");
        require(block.timestamp <= workflow.deadline, "Workflow expired");
        
        // Execute atomic payments
        for (uint256 i = 0; i < workflow.agents.length; i++) {
            payable(workflow.agents[i].agentAddress).transfer(workflow.agents[i].payment);
        }
        
        workflow.status = Status.COMPLETED;
        emit WorkflowCompleted(workflowId, workflow.totalPayment);
    }
    
    function failWorkflow(uint256 workflowId) external {
        Workflow storage workflow = workflows[workflowId];
        require(workflow.client == msg.sender || block.timestamp > workflow.deadline, "Unauthorized");
        require(workflow.status != Status.COMPLETED, "Already completed");
        
        workflow.status = Status.FAILED;
        payable(workflow.client).transfer(workflow.totalPayment);
        
        emit WorkflowFailed(workflowId);
    }
}