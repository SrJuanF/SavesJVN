const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// 6 months in seconds (approx 180 days)
const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60; // 15,552,000 seconds

// cCOP token addresses
const CELO_MAINNET_CCOP = "0x8A567e2aE79CA692Bd748aB832081C45de4041eA";
const CELO_SEPOLIA_CCOP = "0x5F8d55c3627d2dc0a2B4afa798f877242F382F67";

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
  const savesJVN = await deploy("SavesJVN", {
    from: deployer,
    args: [tokenAddress, SIX_MONTHS_SECONDS],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  //log(`SavesJVN deployed on ${networkName} with address ${savesJVN.address}`);
  /*if (networkName === "celoMainnet" || networkName === "celoSepolia") {
    await verify(savesJVN.address, [tokenAddress, SIX_MONTHS_SECONDS]);
  }*/
};

module.exports.tags = ["Celo"];