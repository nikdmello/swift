// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    mapping(address => bool) public isRegistered;

    event AgentRegistered(address indexed agent);

    function registerAgent() external {
        require(!isRegistered[msg.sender], "Already registered");
        isRegistered[msg.sender] = true;
        emit AgentRegistered(msg.sender);
    }

    function isAgentRegistered(address _agent) external view returns (bool) {
        return isRegistered[_agent];
    }
}
