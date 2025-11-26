const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");

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
  const savesJVN = await deploy("SavesJVN", {
    from: deployer,
    args: [tokenAddress, SIX_MONTHS_SECONDS],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  // Verificación automática usando Etherscan API V2 (evita redes locales)
  try {
    const canVerify = process.env.ETHERSCAN_API_KEY && !developmentChains.includes(network.name);
    if (canVerify) {
      await verify(savesJVN.address, [tokenAddress, SIX_MONTHS_SECONDS]);
      log(`Verificación enviada para SavesJVN en ${network.name} (${savesJVN.address})`);
    } else {
      log("Omitiendo verificación: red local o ETHERSCAN_API_KEY no definido");
    }
  } catch (e) {
    log(`Error al verificar SavesJVN en ${network.name}`);
    log(e?.message || String(e));
  }
};

module.exports.tags = ["EVM"];