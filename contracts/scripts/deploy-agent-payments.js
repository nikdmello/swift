const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AgentPayments contract...");
  
  const AgentPayments = await ethers.getContractFactory("AgentPayments");
  const agentPayments = await AgentPayments.deploy();
  
  await agentPayments.waitForDeployment();
  
  const address = await agentPayments.getAddress();
  console.log("AgentPayments deployed to:", address);
  
  // Update addresses.json
  const fs = require('fs');
  const path = require('path');
  
  const addressesPath = path.join(__dirname, '../../frontend/lib/addresses.json');
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  addresses.AGENT_PAYMENTS_ADDRESS = address;
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });