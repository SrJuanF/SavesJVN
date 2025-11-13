// Prueba separada de lock (payable) y stake (no payable) en el contrato Staking
// Uso: npx hardhat run scripts/TestStake.js --network shibuyaTestnet

const hre = require("hardhat");

async function main() {
  const { deployments, ethers, network, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  // Elegir el deployment del contrato: permite STAKING_DEPLOYMENT_NAME, por defecto 'Staking'

  let stakingDeployment = await deployments.get("Staking");

  const staking = await ethers.getContractAt(
    "Staking",
    stakingDeployment.address,
    signer
  );

  const dappTarget = process.env.ASTAR_DAPP_TARGET || "0xd9e81adadad5f0a0b59b1a70e0b0118b85e2e2d3";
  if (!dappTarget || dappTarget === "") {
    throw new Error(
      "ASTAR_DAPP_TARGET no está definido. Establece la dirección del dApp EVM objetivo."
    );
  }

  // Monto fijo para pruebas: 5 SBY
  const amountWei = ethers.parseEther("5"); // ethers v6 devuelve bigint
  // Asegurar que el valor cabe en uint128 antes de enviarlo al contrato
  const UINT128_MAX = (1n << 128n) - 1n;
  function toUint128(x) {
    const v = typeof x === "bigint" ? x : BigInt(x);
    if (v < 0n) throw new Error("amountU128 no puede ser negativo");
    if (v > UINT128_MAX)
      throw new Error("amountU128 excede el rango de uint128");
    return v;
  }
  const amountU128 = toUint128(amountWei);

  console.log("Red:", network.name);
  console.log("Deployer:", deployer);
  console.log("Staking deployment:", "Staking", stakingDeployment.address);
  console.log("DApp target:", dappTarget);
  console.log("Monto (SBY):", "5");

  // 0) CONSULTA DE ESTADO DEL PROTOCOLO
  console.log("\n[0/2] Consultando estado del protocolo (protocol_state)...");
  try {
    const ps = await staking.getProtocolState();
    const era = ps.era ?? ps[0];
    const period = ps.period ?? ps[1];
    const subperiod = ps.subperiod ?? ps[2];
    console.log("ProtocolState:", {
      era: era?.toString?.(),
      period: period?.toString?.(),
      subperiod: subperiod?.toString?.(),
    });
  } catch (err) {
    const reason = extractRevertReason(err);
    console.error(
      "Error al consultar getProtocolState:",
      reason || err?.message || String(err)
    );
  }

  // 1) LOCK (payable)
  /*let gasLimitLock;
  try {
    gasLimitLock = await staking.lock.estimateGas(amountU128);
    gasLimitLock = (gasLimitLock * 12n) / 10n; // +20%
  } catch (e) {
    gasLimitLock = 300_000n;
  }*/

  console.log("\n[1/2] lock(amount) sin msg.value (el contrato reenvía desde su balance)...");
  try {
    const okLock = await staking.lock.staticCall(amountU128);
    console.log("Preflight lock.staticCall ->", okLock);
  } catch (err) {
    const reason = extractRevertReason(err);
    console.error(
      "Preflight lock revert reason:",
      reason || err?.message || String(err)
    );
    // Continuamos para intentar enviar y obtener hash igualmente
  }
  
  // Verificar que el contrato tiene balance suficiente para reenviar 'amount' al precompile
  const contractBalance = await ethers.provider.getBalance(staking.target);
  console.log(
    "Balance del contrato:",
    ethers.formatEther(contractBalance),
    "SBY"
  );
  if (contractBalance < amountWei) {
    console.error(
      `Balance insuficiente en el contrato para lock: necesita ${ethers.formatEther(
        amountWei
      )} SBY, tiene ${ethers.formatEther(contractBalance)} SBY`
    );
    return;
  }

  const txLock = await staking.lock(amountU128);
  console.log("Tx lock hash:", txLock.hash);
  console.log("Explorer:", `${explorerBase(network.name)}${txLock.hash}`);

  const receiptLock = await waitReceiptResilient(txLock, ethers);
  if (!receiptLock) {
    console.warn(
      "No se pudo obtener el receipt de lock. Verifica en el explorer."
    );
    return;
  }
  console.log(
    "Lock receipt status:",
    receiptLock.status,
    "gasUsed:",
    receiptLock.gasUsed?.toString?.()
  );
  if (receiptLock.status === 0) {
    console.error(
      "La transacción de lock fue revertida (status=0). Deteniendo flujo."
    );
    return;
  } else {
    console.log("Lock completado por 5 SBY.");
  }

  // 2) STAKE (no payable)
  console.log("\n[2/2] stake(appAdress, amount) sin value...");
  try {
    const okStake = await staking.stake.staticCall(dappTarget, amountU128);
    console.log("Preflight stake.staticCall ->", okStake);
  } catch (err) {
    const reason = extractRevertReason(err);
    console.error(
      "Preflight stake revert reason:",
      reason || err?.message || String(err)
    );
    // Continuamos para intentar enviar y obtener hash igualmente
  }

  let gasLimitStake;
  try {
    gasLimitStake = await staking.stake.estimateGas(dappTarget, amountU128);
    gasLimitStake = (gasLimitStake * 12n) / 10n; // +20%
  } catch (e) {
    gasLimitStake = 500_000n;
  }

  const txStake = await staking.stake(dappTarget, amountU128, {
    gasLimit: gasLimitStake,
  });
  console.log("Tx stake hash:", txStake.hash);
  console.log("Explorer:", `${explorerBase(network.name)}${txStake.hash}`);

  const receiptStake = await waitReceiptResilient(txStake, ethers);
  if (!receiptStake) {
    console.warn(
      "No se pudo obtener el receipt de stake. Verifica en el explorer."
    );
    return;
  }
  console.log(
    "Stake receipt status:",
    receiptStake.status,
    "gasUsed:",
    receiptStake.gasUsed?.toString?.()
  );
  if (receiptStake.status === 0) {
    console.error(
      "La transacción de stake fue revertida (status=0). Revisa el explorer para más detalles."
    );
  } else {
    console.log("Stake completado por 5 SBY.");
  }
}

function extractRevertReason(err) {
  try {
    // ethers v6 style
    const data = err?.error?.data || err?.data || err?.info?.error?.data;
    if (typeof data === "string" && data.startsWith("0x")) {
      return decodeReason(data);
    }
    const msg = err?.error?.message || err?.message;
    return msg;
  } catch (_) {
    return undefined;
  }
}

function decodeReason(dataHex) {
  // Standard Error(string) selector 0x08c379a0
  if (!dataHex || dataHex.length < 10) return undefined;
  const selector = dataHex.slice(0, 10);
  if (selector !== "0x08c379a0") return undefined;
  // Strip selector and decode string
  const data = dataHex.slice(10);
  try {
    const bytes = Buffer.from(data, "hex");
    // ABI: offset (32), string length (32), string bytes
    // A simple heuristic to locate the string
    const len = Number(BigInt("0x" + bytes.slice(36, 68).toString("hex")));
    return bytes.slice(68, 68 + len).toString();
  } catch (_) {
    return undefined;
  }
}

function explorerBase(networkName) {
  return networkName === "shibuyaTestnet"
    ? "https://shibuya.blockscout.com/tx/"
    : "https://astar.blockscout.com/tx/";
}

async function waitReceiptResilient(tx, ethers) {
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (waitErr) {
    console.warn(
      "Fallo al esperar receipt. Intentando provider.waitForTransaction..."
    );
    try {
      receipt = await ethers.provider.waitForTransaction(tx.hash, 1, 60000);
    } catch (wftErr) {
      console.warn(
        "waitForTransaction también falló. Intentando getTransactionReceipt..."
      );
      receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    }
  }
  return receipt;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
