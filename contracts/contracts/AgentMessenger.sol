// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    function isAgentRegistered(address _agent) external view returns (bool);
}

interface IStreamManager {
    function depositStream(
        address from,
        address to,
        uint256 amountPerMinute,
        uint256 durationMinutes
    ) external payable;
}

contract AgentMessenger {
    IAgentRegistry public registry;
    IStreamManager public streamManager;

    event MessageSent(
        address indexed sender,
        address indexed recipient,
        string messageType,
        string payload,
        uint256 amountPerMinute,
        uint256 durationMinutes,
        uint256 timestamp
    );

    constructor(address _registryAddress, address _streamManager) {
        registry = IAgentRegistry(_registryAddress);
        streamManager = IStreamManager(_streamManager);
    }

    function sendMessageWithStream(
        address recipient,
        string memory messageType,
        string memory payload,
        uint256 amountPerMinute,
        uint256 durationMinutes
    ) external payable {
        uint256 totalAmount = amountPerMinute * durationMinutes;
        require(msg.value == totalAmount, "Incorrect ETH sent");

        // Forward funds into the StreamManager for escrow
        streamManager.depositStream{value: msg.value}(
            msg.sender,
            recipient,
            amountPerMinute,
            durationMinutes
        );

        emit MessageSent(
            msg.sender,
            recipient,
            messageType,
            payload,
            amountPerMinute,
            durationMinutes,
            block.timestamp
        );
    }
}
