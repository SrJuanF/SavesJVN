const hre = require("hardhat");
const { ethers, deployments, getNamedAccounts, network } = hre;

// Minimal ABI para consultar balance ERC20 si el contrato fuera tokenizado
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
  if (network.name !== "shibuyaTestnet") {
    throw new Error(
      `Este script está pensado para Shibuya. Red actual: ${network.name}`
    );
  }

  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  // Obtener address del contrato desplegado vía hardhat-deploy
  let deployed;
  try {
    deployed = await deployments.get("SavesJVN");
  } catch (e) {
    throw new Error(
      `No se encontró un deployment de SavesJVN para la red "${network.name}". Despliega primero con "npm run deploy:shibuya".`
    );
  }

  const SavesJVN = await ethers.getContractFactory("SavesJVN", signer);
  const contract = SavesJVN.attach(deployed.address).connect(signer);
  console.log(`Usando contrato: ${contract.target} (red: ${network.name})`);

  let amount;

  // Balance nativo del contrato
  amount = await ethers.provider.getBalance(contract.target);
  console.log(`Balance nativo del contrato: ${ethers.formatEther(amount)} SBY`);

  if (amount === 0n) {
    console.log("El balance es 0. No hay nada para enviar.");
    return;
  }

  // Preflight para obtener motivo de revert si aplica (onlyOwner)
  try {
    await contract._sendTokens.staticCall(deployer, amount);
    console.log("Preflight (staticCall) OK, enviando transacción...");
  } catch (e) {
    console.warn(
      "Preflight (staticCall) indicó un revert:",
      e?.info?.error?.message || e?.shortMessage || e?.reason || e?.message || e
    );
    console.warn(
      "Se enviará la transacción igualmente para obtener hash y revisar en el explorer."
    );
  }

  // Enviar transacción y mostrar hash y enlace al explorer
  const gasLimit = 1_000_000n;
  const tx = await contract._sendTokens(deployer, amount, { gasLimit });
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log(
    "Receipt status:",
    receipt.status,
    "gasUsed:",
    receipt.gasUsed?.toString?.()
  );
  const explorer = "https://shibuya.blockscout.com/tx/";
  console.log("Explorer:", `${explorer}${tx.hash}`);
  if (receipt.status === 0) {
    console.error(
      "La transacción fue revertida (status=0). Revisa el explorer para más detalles."
    );
  } else {
    console.log(
      `Envío completado. Se transfirieron ${tokenAddr === ethers.ZeroAddress ? ethers.formatEther(amount) + " SBY" : amount.toString()} al deployer (${deployer}).`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
