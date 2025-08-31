require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    compilers: [
      { version: '0.8.20' },
      { version: '0.8.28' },
    ],
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532,
    },
  },
};
