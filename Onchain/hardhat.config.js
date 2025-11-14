require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    celoMainnet: {
      url: process.env.CELO_MAINNET_RPC || "https://rpc.ankr.com/celo",
      chainId: 42220,
      accounts: PRIVATE_KEY,
      saveDeployments: true,
    },
    celoSepolia: {
      url: process.env.CELO_SEPOLIA_RPC || "https://rpc.ankr.com/celo_sepolia",
      chainId: 11142220,
      accounts: PRIVATE_KEY,
      saveDeployments: true,
    },
    astarMainnet: {
      url: process.env.ASTAR_MAINNET_RPC || "https://rpc.astar.network",
      chainId: 592,
      accounts: PRIVATE_KEY,
      saveDeployments: true,
    },
    shibuyaTestnet: {
      url: process.env.ASTAR_SHIBUYA_RPC || "https://rpc.shibuya.astar.network",
      chainId: 81,
      accounts: PRIVATE_KEY,
      saveDeployments: true,
    },
  },
    etherscan: {
    // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      celoMainnet: process.env.ETHERSCAN_API_KEY || "",
      celoSepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celoMainnet",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS || false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
  /*
    contractSizer: {
        runOnCompile: false,
        only: ["PhysicalRental"],
    },*/
};

