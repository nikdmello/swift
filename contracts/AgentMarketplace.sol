// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentMarketplace {
    struct Service {
        address provider;
        string serviceType;
        uint256 price;
        bool active;
        uint256 totalSales;
    }
    
    struct ServiceRequest {
        address consumer;
        address provider;
        string serviceType;
        uint256 payment;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Service) public services;
    mapping(address => string[]) public providerServices;
    ServiceRequest[] public serviceHistory;
    
    event ServiceRegistered(address indexed provider, string serviceType, uint256 price);
    event ServicePurchased(address indexed consumer, address indexed provider, string serviceType, uint256 payment);
    
    function registerService(string memory serviceType, uint256 price) external {
        bytes32 serviceId = keccak256(abi.encodePacked(msg.sender, serviceType));
        
        services[serviceId] = Service({
            provider: msg.sender,
            serviceType: serviceType,
            price: price,
            active: true,
            totalSales: 0
        });
        
        providerServices[msg.sender].push(serviceType);
        
        emit ServiceRegistered(msg.sender, serviceType, price);
    }
    
    function purchaseService(address provider, string memory serviceType) external payable {
        bytes32 serviceId = keccak256(abi.encodePacked(provider, serviceType));
        Service storage service = services[serviceId];
        
        require(service.active, "Service not available");
        require(msg.value >= service.price, "Insufficient payment");
        
        // Transfer payment to provider
        payable(provider).transfer(msg.value);
        
        // Update service stats
        service.totalSales++;
        
        // Record transaction
        serviceHistory.push(ServiceRequest({
            consumer: msg.sender,
            provider: provider,
            serviceType: serviceType,
            payment: msg.value,
            timestamp: block.timestamp
        }));
        
        emit ServicePurchased(msg.sender, provider, serviceType, msg.value);
    }
    
    function getService(address provider, string memory serviceType) external view returns (Service memory) {
        bytes32 serviceId = keccak256(abi.encodePacked(provider, serviceType));
        return services[serviceId];
    }
    
    function getServiceHistory() external view returns (ServiceRequest[] memory) {
        return serviceHistory;
    }
}