const hre = require("hardhat");
const { ethers, deployments, getNamedAccounts, network } = hre;

/**
 * Script: WithdrawToBeneficiary
 * Llama a SavesJVN.withdrawToBeneficiary(fundId=0, amount=10, to=deployer)
 *
 * Cómo ejecutar:
 *   npx hardhat run --network <red> scripts/WithdrawToBeneficiary.js
 *
 * Nota:
 * - La función puede revertir si no se cumplen las reglas del contrato:
 *   - msg.sender debe estar en privileged del fondo o ser el owner
 *   - "to" debe estar en beneficiaries del fondo
 *   - Debe haberse alcanzado endTime (NotMatured en caso contrario)
 *   - amount debe estar disponible (balance - stakedBalance)
 * - amount=10 se pasa tal cual en unidades del contrato:
 *   - Si token == address(0): 10 wei nativos
 *   - Si token != address(0): 10 unidades del token (no ajusta decimales)
 */

async function main() {
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  console.log(`Network: ${network.name}, Deployer: ${deployer}`);

  // Obtener address del contrato desplegado vía hardhat-deploy
  let deployed;
  try {
    deployed = await deployments.get("SavesJVN");
  } catch (e) {
    throw new Error(
      `No se encontró un deployment de SavesJVN para la red "${network.name}". Despliega primero con el script de deploy correspondiente.`
    );
  }

  const SavesJVN = await ethers.getContractFactory("SavesJVN", signer);
  const contract = SavesJVN.attach(deployed.address).connect(signer);
  console.log(`Usando contrato: ${contract.target}`);

  const fundId = 5;
  const amount = ethers.parseEther("5"); // ver nota arriba sobre unidades
  const to = deployer;

  // Mostrar modo (token / nativo) para referencia de unidades
  const tokenAddr = await contract.token();
  console.log(
    `token del contrato: ${tokenAddr} (${tokenAddr === ethers.ZeroAddress ? "nativo (wei)" : "ERC20 (unidades sin ajustar decimales)"})`
  );

  console.log(
    `Llamando withdrawToBeneficiary(fundId=${fundId}, amount=${amount.toString()}, to=${to})...`
  );

  // Preflight para conocer el motivo de revert sin enviar transacción
  try {
    await contract.withdrawToBeneficiary.staticCall(fundId, amount, to);
    console.log("Preflight (staticCall) OK, enviando transacción...");
  } catch (e) {
    console.warn(
      "Preflight (staticCall) indicó un posible revert:",
      e?.info?.error?.message || e?.shortMessage || e?.reason || e?.message || e
    );
    console.warn("Se enviará la transacción igualmente para obtener hash y revisar en el explorer si aplica.");
  }

  // Enviar transacción con un gasLimit conservador si estimateGas falla
  let gasLimit = 800_000n;
  try {
    gasLimit = await contract.withdrawToBeneficiary.estimateGas(fundId, amount, to);
    gasLimit = (gasLimit * 12n) / 10n; // +20%
  } catch (_) {
    // usar fallback
  }

  try {
    const tx = await contract.withdrawToBeneficiary(fundId, amount, to, { gasLimit });
    console.log("Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Receipt status:", receipt.status, "gasUsed:", receipt.gasUsed?.toString?.());
    if (receipt.status === 0) {
      console.error("La transacción fue revertida (status=0). Revisa el explorer para más detalles.");
    } else {
      console.log("withdrawToBeneficiary ejecutado correctamente.");
    }
  } catch (err) {
    const txHash = err?.transactionHash || err?.transaction?.hash;
    if (txHash) {
      console.log("Tx hash (capturado en error):", txHash);
    }
    console.error("Error en withdrawToBeneficiary:", err?.reason || err?.shortMessage || err?.message || err);
    throw err;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});