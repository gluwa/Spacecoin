import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      gas: 72_000_000, // Creditcoin can support high gas limit
      blockGasLimit: 72_000_000, // Creditcoin can support high gas limit
      gasPrice: 1_000_000_000 // 1 gwei
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 72_000_000, // Creditcoin can support high gas limit
      blockGasLimit: 72_000_000,
      gasPrice: 1_000_000_000 // 1 gwei
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY]
    },
    cc3_testnet: {
      url: process.env.CC3_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY]
    },
    cc3: {
      url: process.env.CC3_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 340
      }
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  etherscan: {
    apiKey: {
      cc3: `${process.env.BLOCKSCOUT_API_KEY}`,
      cc3_testnet: `${process.env.BLOCKSCOUT_API_KEY_TESTNET}`
    },
    customChains: [
      {
        network: "cc3",
        chainId: 102030,
        urls: {
          apiURL: "https://creditcoin.blockscout.com/api",
          browserURL: "https://creditcoin.blockscout.com"
        }
      },
      {
        network: "cc3_testnet",
        chainId: 102031,
        urls: {
          apiURL: "https://creditcoin-testnet.blockscout.com/api",
          browserURL: "https://creditcoin-testnet.blockscout.com"
        }
      }
    ]
  }
};

export default config;
