const { network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId
  const cfg = networkConfig[chainId]
  if (!cfg || !cfg.IsmpHost) {
    throw new Error(`IsmpHost no configurado para chainId ${chainId}`)
  }

  log("----------------------------------------------------")
  await deploy("Bridges", {
    from: deployer,
    args: [cfg.IsmpHost],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log(`Bridges desplegado en ${network.name}`)
}

module.exports.tags = ["Bridges"]