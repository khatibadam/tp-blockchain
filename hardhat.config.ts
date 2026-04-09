import "dotenv/config";
import { defineConfig, configVariable } from "hardhat/config";
import HardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const SEPOLIA_RPC_URL = configVariable("SEPOLIA_RPC_URL");
const PRIVATE_KEY = configVariable("PRIVATE_KEY");
const ETHERSCAN_API_KEY = configVariable("ETHERSCAN_API_KEY");

export default defineConfig({
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    },
  },
  plugins: [HardhatToolboxMochaEthers],
});