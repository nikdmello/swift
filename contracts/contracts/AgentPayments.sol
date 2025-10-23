// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentPayments {
    event AgentPaid(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        string service,
        uint256 timestamp
    );
    
    // Simple payment - like Stripe for AI agents
    function payAgent(address to, string memory service) external payable {
        require(to != address(0), "Invalid recipient");
        require(msg.value > 0, "Payment required");
        
        // Direct transfer - instant like Stripe
        payable(to).transfer(msg.value);
        
        emit AgentPaid(msg.sender, to, msg.value, service, block.timestamp);
    }
    
    // Batch payments for high TPS
    function batchPayAgents(
        address[] memory recipients, 
        uint256[] memory amounts, 
        string[] memory services
    ) external payable {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == services.length, "Length mismatch");
        
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalRequired += amounts[i];
        }
        require(msg.value >= totalRequired, "Insufficient payment");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amounts[i]);
            emit AgentPaid(msg.sender, recipients[i], amounts[i], services[i], block.timestamp);
        }
    }
}