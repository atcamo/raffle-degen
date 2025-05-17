const { config: dotenvConfig } = require('dotenv');
dotenvConfig();
require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.20',
  networks: {
    base: {
      url: 'https://mainnet.base.org',
      accounts: ['f01587f840fa9800f864eb47326827e12c4dd980897bdf28c553c4b6f371c874'],
      chainId: 8453
    },
  },
}; 