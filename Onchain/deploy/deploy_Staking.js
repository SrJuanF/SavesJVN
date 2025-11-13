const { ethers, network } = require("hardhat");

// Despliega Staking.sol y le envía 11 SBY (en Shibuya) como balance inicial
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const value = network.name === "shibuyaTestnet" ? ethers.parseEther("16") : 0n;

  log("----------------------------------------------------");
  log(`Desplegando Staking en ${network.name} desde ${deployer} con value=${value.toString()} wei`);
  await deploy("Staking", {
    from: deployer,
    args: [],
    value,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`Staking desplegado en ${network.name}`);
};

module.exports.tags = ["Staking"];