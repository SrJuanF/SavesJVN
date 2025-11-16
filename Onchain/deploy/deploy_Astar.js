const { ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

// 6 months in seconds (approx 180 days)
const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60; // 15,552,000 seconds

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  const cfg = networkConfig[chainId];
  if (!cfg || !cfg.erc20) {
    throw new Error(`ERC20 no configurado para chainId ${chainId}`);
  }
  const tokenAddress = cfg.erc20;

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