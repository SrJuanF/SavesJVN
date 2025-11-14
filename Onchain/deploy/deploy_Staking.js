const { ethers, network } = require("hardhat");

/*
git add . && \
rm -rf Ahorro-JVN/.git && \
git rm --cached -rf Ahorro-JVN && \
rm -rf Onchain/.git && \
git rm --cached -rf Onchain && \
git add Ahorro-JVN && \
git add Onchain 
git commit -m "proxys-fit deploy"
git push -u origin main
*/

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