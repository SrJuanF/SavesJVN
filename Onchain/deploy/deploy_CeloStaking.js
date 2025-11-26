const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const ELECTION_GROUP = "0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9";
const SWAP = "0xBE729350F8CdFC19DB6866e8579841188eE57f67";
const CCOP = "0x434563B0604BE100F04B7Ae485BcafE3c9D8850E"; // increaseAllowance
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const isCeloNetwork = chainId === 42220 || chainId === 11142220;
  if (!isCeloNetwork) {
    log("----------------------------------------------------");
    log(
      `Saltando despliegue de StakingCelo: ${network.name} no es red de Celo`
    );
    return;
  }
  const cfg = networkConfig[chainId];
  if (!cfg || !cfg.celoAccount || !cfg.celoLockedGold || !cfg.celoElection) {
    throw new Error(
      `Config incompleta para Celo (chainId=${chainId}). Verifica helper-hardhat-config.js`
    );
  }

  log("----------------------------------------------------");
  log(`Desplegando StakingCelo en ${network.name} desde ${deployer}`);
  try {
    const deployment = await deploy("StakingCelo", {
      from: deployer,
      args: [cfg.celoAccount, cfg.celoLockedGold, cfg.celoElection, SWAP, CCOP],
      log: true,
      waitConfirmations: VERIFICATION_BLOCK_CONFIRMATIONS || 2,
    });
    log(`StakingCelo desplegado en ${network.name} en ${deployment.address}`);
    // Verificación automática con Etherscan API V2 (evita redes locales)
    try {
      const canVerify =
        process.env.ETHERSCAN_API_KEY &&
        !developmentChains.includes(network.name);
      if (canVerify) {
        const ok = await verify(deployment.address, [
          cfg.celoAccount,
          cfg.celoLockedGold,
          cfg.celoElection,
          SWAP,
          CCOP,
        ]);
        if (ok) {
          log(
            `Verificación enviada para StakingCelo en ${network.name} (${deployment.address})`
          );
        } else {
          log(
            `Verificación fallida para StakingCelo en ${network.name} (${deployment.address})`
          );
        }
      } else {
        log(
          "Omitiendo verificación: red local o ETHERSCAN_API_KEY no definido"
        );
      }
    } catch (verr) {
      log(`Error al verificar StakingCelo en ${network.name}`);
      log(verr?.message || String(verr));
    }
  } catch (e) {
    log(
      `ERROR: Despliegue de StakingCelo revertido/fallido en ${network.name}`
    );
    // Mostrar detalle del error y posibles razones
    const detail = e?.error?.message || e?.message || String(e);
    log(detail);
    // Re-lanzar para que la tarea de deploy falle explícitamente
    throw e;
  }
};

module.exports.tags = ["StakingCelo"];
