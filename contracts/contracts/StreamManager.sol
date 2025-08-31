// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StreamManager {
    struct Stream {
        uint256 startTime;
        uint256 flowRate; // wei per second
        uint256 lastUpdate;
        uint256 balance;
        bool active;
    }

    mapping(address => mapping(address => Stream)) public streams;

    event StreamOpened(address indexed from, address indexed to, uint256 flowRate);
    event StreamCancelled(address indexed from, address indexed to, uint256 refunded);
    event Withdrawn(address indexed to, address indexed from, uint256 amount);

    receive() external payable {}

    /// Called by the UI/user directly
    function openStream(address to, uint256 flowRatePerSecond) external payable {
        require(flowRatePerSecond > 0, "Zero rate");
        require(msg.value > 0, "Must deposit ETH");

        Stream storage stream = streams[msg.sender][to];
        require(!stream.active, "Stream already active");

        stream.startTime = block.timestamp;
        stream.flowRate = flowRatePerSecond;
        stream.lastUpdate = block.timestamp;
        stream.balance = msg.value;
        stream.active = true;

        emit StreamOpened(msg.sender, to, flowRatePerSecond);
    }

    /// NEW: Called by AgentMessenger with escrowed ETH
    function depositStream(
        address from,
        address to,
        uint256 amountPerMinute,
        uint256 durationMinutes
    ) external payable {
        require(amountPerMinute > 0, "Invalid rate");
        require(durationMinutes > 0, "Invalid duration");

        uint256 expected = amountPerMinute * durationMinutes;
        require(msg.value == expected, "Incorrect ETH sent");

        Stream storage stream = streams[from][to];
        require(!stream.active, "Stream already active");

        stream.startTime = block.timestamp;
        stream.flowRate = amountPerMinute / 60; // convert to per second
        stream.lastUpdate = block.timestamp;
        stream.balance = msg.value;
        stream.active = true;

        emit StreamOpened(from, to, stream.flowRate);
    }

    function getOwed(address from, address to) public view returns (uint256) {
        Stream storage stream = streams[from][to];
        if (!stream.active) return 0;

        uint256 elapsed = block.timestamp - stream.lastUpdate;
        uint256 owed = elapsed * stream.flowRate;
        return owed > stream.balance ? stream.balance : owed;
    }

    function withdraw(address from) external {
        Stream storage stream = streams[from][msg.sender];
        require(stream.active, "No active stream");

        uint256 owed = getOwed(from, msg.sender);
        require(owed > 0, "Nothing to withdraw");

        stream.lastUpdate = block.timestamp;
        stream.balance -= owed;

        payable(msg.sender).transfer(owed);

        emit Withdrawn(msg.sender, from, owed);
    }

    function cancelStream(address to) external {
        Stream storage stream = streams[msg.sender][to];
        require(stream.active, "No active stream");

        // Pay owed amount
        uint256 owed = getOwed(msg.sender, to);
        if (owed > 0) {
            stream.balance -= owed;
            payable(to).transfer(owed);
            emit Withdrawn(to, msg.sender, owed);
        }

        uint256 refund = stream.balance;
        delete streams[msg.sender][to];
        payable(msg.sender).transfer(refund);

        emit StreamCancelled(msg.sender, to, refund);
    }

    function topUp(address to) external payable {
        Stream storage stream = streams[msg.sender][to];
        require(stream.active, "No active stream");
        stream.balance += msg.value;
    }

    function getStream(address from, address to) external view returns (Stream memory) {
        return streams[from][to];
    }
}
