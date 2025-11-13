const { ethers, network } = require("hardhat");

// 6 months in seconds (approx 180 days)
const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60; // 15,552,000 seconds

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // On Astar networks, the ERC20 token address must be address(0)
  const tokenAddress = "0x0000000000000000000000000000000000000000";

  log("----------------------------------------------------");
  await deploy("SavesJVN", {
    from: deployer,
    args: [tokenAddress, SIX_MONTHS_SECONDS],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`SavesJVN deployed on ${network.name}`);
};

module.exports.tags = ["Astar"];