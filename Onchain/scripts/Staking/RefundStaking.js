const hre = require("hardhat");
const { ethers, deployments, getNamedAccounts, network } = hre;

async function main() {
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  // Obtener el contrato Staking desplegado vía hardhat-deploy
  let deployed;
  try {
    deployed = await deployments.get("Staking");
  } catch (e) {
    throw new Error(
      `No se encontró un deployment de Staking para la red "${network.name}". Despliega primero con "npx hardhat deploy --network ${network.name} --tags Staking".`
    );
  }

  const Staking = await ethers.getContractFactory("Staking", signer);
  const contract = Staking.attach(deployed.address).connect(signer);
  console.log(`Usando contrato Staking: ${contract.target} (red: ${network.name})`);

  // Balance nativo actual del contrato
  const amount = await ethers.provider.getBalance(contract.target);
  console.log(`Balance nativo del contrato: ${ethers.formatEther(amount)} SBY`);
  if (amount === 0n) {
    console.log("El balance es 0. No hay nada que devolver.");
    return;
  }

  // Preflight (staticCall) para ver posibles reverts sin gastar gas
  try {
    await contract._sendTokens.staticCall(deployer, amount);
    console.log("Preflight OK: la simulación no detectó revert. Enviando transacción...");
  } catch (e) {
    console.warn("Preflight indicó posible revert:");
    console.warn("- info.error.message:", e?.info?.error?.message);
    console.warn("- shortMessage:", e?.shortMessage);
    console.warn("- reason:", e?.reason);
    console.warn("- message:", e?.message);
    console.warn("Se enviará la transacción igualmente para obtener el hash y revisar en el explorer.");
  }

  // Enviar transacción y mostrar hash y enlace al explorer
  const gasLimit = 1_000_000n;
  const tx = await contract._sendTokens(deployer, amount, { gasLimit });
  console.log("Tx hash:", tx.hash);
  const explorer = network.name === "shibuyaTestnet"
    ? "https://shibuya.blockscout.com/tx/"
    : "https://astar.blockscout.com/tx/";
  console.log("Explorer:", `${explorer}${tx.hash}`);

  let receipt;
  try {
    receipt = await tx.wait();
  } catch (waitErr) {
    console.warn("Fallo al esperar receipt (posible desconexión RPC). Intentando provider.waitForTransaction...");
    try {
      receipt = await ethers.provider.waitForTransaction(tx.hash, 1, 60000);
    } catch (wftErr) {
      console.warn("waitForTransaction también falló. Intentando getTransactionReceipt...");
      receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    }
  }

  if (!receipt) {
    console.warn("No se pudo obtener receipt por desconexión RPC, pero la transacción fue enviada. Verifica en el explorer.");
    return;
  }
  console.log("Receipt status:", receipt.status, "gasUsed:", receipt.gasUsed?.toString?.());
  if (receipt.status === 0) {
    console.error("La transacción fue revertida (status=0). Revisa el explorer para más detalles.");
  } else {
    console.log(`Devolución completada. Se transfirieron ${ethers.formatEther(amount)} SBY al deployer (${deployer}).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});