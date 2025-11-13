const { network } = require("hardhat");

// 6 months in seconds (approx 180 days)
const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60; // 15,552,000 seconds

// cCOP token addresses
const CELO_MAINNET_CCOP = "0x434563B0604BE100F04B7Ae485BcafE3c9D8850E";
const CELO_SEPOLIA_CCOP = "0xEd9A3541f06E45E3d92E937AA74eD878127318E0";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = network.name;
  let tokenAddress;
  if (networkName === "celoMainnet") {
    tokenAddress = CELO_MAINNET_CCOP;
  } else if (networkName === "celoSepolia") {
    tokenAddress = CELO_SEPOLIA_CCOP;
  } else {
    throw new Error(`Unsupported Celo network: ${networkName}. Use celoMainnet or celoSepolia.`);
  }

  log("----------------------------------------------------");
  await deploy("SavesJVN", {
    from: deployer,
    args: [tokenAddress, SIX_MONTHS_SECONDS],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`SavesJVN deployed on ${networkName}`);
};

module.exports.tags = ["Celo"];