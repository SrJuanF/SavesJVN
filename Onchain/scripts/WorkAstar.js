const hre = require("hardhat");
const { ethers, getNamedAccounts, network, deployments } = hre;

// Config por defecto para pruebas
const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60; // 6 meses
const DEFAULT_DEPOSIT = "10"; // 0.001 ASTR (se ajustará automáticamente si es necesario)
const DEFAULT_STAKE = "5"; // Mínimo de stake permitido por el protocolo: 5 SBY
const DEFAULT_DAPP_TARGET = "0xd9e81adadad5f0a0b59b1a70e0b0118b85e2e2d3";

// Helper genérico para reintentar llamadas en caso de errores de socket (UND_ERR_SOCKET)
async function withRetry(action, attempts = 3, delayMs = 1500) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await action();
    } catch (err) {
      const isSocketErr = err?.code === 'UND_ERR_SOCKET' || /UND_ERR_SOCKET/i.test(err?.message || '');
      if (!isSocketErr || i === attempts - 1) throw err;
      console.warn(`Error de socket detectado (UND_ERR_SOCKET). Reintentando ${i + 1}/${attempts}...`, err?.code || err?.message || err);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function ensureContract(networkName, signer) {
  // Obtiene el address del contrato desplegado usando hardhat-deploy para la red actual
  let deployed;
  try {
    deployed = await deployments.get("SavesJVN");
  } catch (e) {
    throw new Error(
      `No se encontró un deployment de SavesJVN para la red "${networkName}". Despliega primero con "npm run deploy:shibuya" o "npm run deploy:astar-mainnet".`
    );
  }

  const SavesJVN = await ethers.getContractFactory("SavesJVN", signer);
  console.log(`Usando contrato desplegado en ${networkName}: ${deployed.address}`);
  return SavesJVN.attach(deployed.address).connect(signer);
}

async function createFund(contract, deployer) {
  // Privileged y Beneficiaries incluyen al deployer para facilitar pruebas
  const ZERO = ethers.ZeroAddress;
  const privileged = [deployer.address, ZERO, ZERO, ZERO];
  const beneficiaries = [deployer.address, ZERO, ZERO, ZERO];
  const fundType = 1; // AhorroUniversitario
  const durationSeconds = 0; // pruebas: 15 minutos (si durationSeconds == 0 y fundType == AhorroUniversitario)
  const tx = await withRetry(() => contract.createFund(fundType, durationSeconds, privileged, beneficiaries));
  await withRetry(() => tx.wait());
  // Obtener fundId a partir de nextFundId - 1 (el contrato incrementa después de crear)
  const nextId = await withRetry(() => contract.nextFundId());
  const fundId = Number(nextId - 1n);
  console.log(`Fondo creado: fundId=${fundId}`);
  return fundId;
}

async function depositNative(contract, fundId, amountEth) {
  const depositWei = ethers.parseEther(amountEth);
  console.log(`Depositando nativo ASTR: ${amountEth} (${depositWei} wei) en fundId=${fundId}`);
  const tx = await withRetry(() => contract.depositNative(fundId, { value: depositWei }));
  await withRetry(() => tx.wait());
  console.log("Depósito nativo OK");
}

async function setDappTarget(contract, fundId) {
  const dappTarget = process.env.ASTAR_DAPP_TARGET || DEFAULT_DAPP_TARGET;
  if (!dappTarget) {
    console.warn("ASTAR_DAPP_TARGET no está definido. Se omite setDappTarget y pruebas de staking.");
    return false;
  }
  console.log(`Configurando dappTarget=${dappTarget} en fundId=${fundId}`);
  const tx = await withRetry(() => contract.setDappTarget(fundId, dappTarget));
  await withRetry(() => tx.wait());
  console.log("dappTarget configurado OK");
  return true;
}

async function stake(contract, fundId, amountEth) {
  const stakeWei = ethers.parseEther(amountEth);
  // Asegurar que el valor cabe en uint128 antes de enviarlo al contrato
  const UINT128_MAX = (1n << 128n) - 1n;
  function toUint128(x) {
    const v = typeof x === "bigint" ? x : BigInt(x);
    if (v < 0n) throw new Error("amountU128 no puede ser negativo");
    if (v > UINT128_MAX)
      throw new Error("amountU128 excede el rango de uint128");
    return v;
  }
  const amt128 = toUint128(stakeWei);
  console.log(`Ejecutando stakeASTR: ${amountEth} (${stakeWei} wei) en fundId=${fundId}`);

  // Preflight para obtener motivo de revert si aplica (sin enviar valor)
  try {
    const ok = await contract.stakeASTR.staticCall(fundId, amt128);
    console.log("Preflight stakeASTR.staticCall ->", ok);
  } catch (e) {
    console.warn(
      "Preflight (staticCall) indicó un revert:",
      e?.info?.error?.message || e?.shortMessage || e?.reason || e?.message || e
    );
    console.warn("Se enviará la transacción igualmente para obtener hash y revisar en el explorer.");
  }

  // Intentar estimar gas y usar fallback si falla, para obtener hash aunque estimateGas revierte
  let gasLimit = 2_000_000n;
  try {
    gasLimit = await contract.stakeASTR.estimateGas(fundId, amt128);
    gasLimit = (gasLimit * 12n) / 10n; // +20%
  } catch (_) {
    // dejamos gasLimit en 2,000,000
  }

  try {
    const tx = await contract.stakeASTR(fundId, amt128, { gasLimit });
    console.log("Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Receipt status:", receipt.status, "gasUsed:", receipt.gasUsed?.toString?.());
    const explorer = network.name === "shibuyaTestnet"
      ? "https://shibuya.blockscout.com/tx/"
      : "https://astar.blockscout.com/tx/";
    console.log("Explorer:", `${explorer}${tx.hash}`);
    if (receipt.status === 0) {
      console.error("La transacción fue revertida (status=0). Revisa el explorer para más detalles.");
    } else {
      console.log("stakeASTR OK");
    }
  } catch (err) {
    const txHash = err?.transactionHash || err?.transaction?.hash;
    if (txHash) {
      const explorer = network.name === "shibuyaTestnet"
        ? "https://shibuya.blockscout.com/tx/"
        : "https://astar.blockscout.com/tx/";
      console.log("Tx hash (capturado en error):", txHash);
      console.log("Explorer:", `${explorer}${txHash}`);
    }
    console.error("stakeASTR error:", err?.reason || err?.shortMessage || err?.message || err);
    throw err;
  }
}

async function endStake(contract, fundId, amountEth) {
  const unstakeWei = ethers.parseEther(amountEth);
  // Asegurar que el valor cabe en uint128 antes de enviarlo al contrato
  const UINT128_MAX = (1n << 128n) - 1n;
  function toUint128(x) {
    const v = typeof x === "bigint" ? x : BigInt(x);
    if (v < 0n) throw new Error("amountU128 no puede ser negativo");
    if (v > UINT128_MAX)
      throw new Error("amountU128 excede el rango de uint128");
    return v;
  }
  const amt128 = toUint128(unstakeWei);
  console.log(`Ejecutando endStake: ${amountEth} (${unstakeWei} wei) en fundId=${fundId}`);

  // Preflight de endStake (internamente hace unstake y unlock)
  try {
    const ok = await contract.endStake.staticCall(fundId, amt128);
    console.log("Preflight endStake.staticCall ->", ok);
  } catch (e) {
    console.warn(
      "Preflight (staticCall) endStake indicó un revert:",
      e?.info?.error?.message || e?.shortMessage || e?.reason || e?.message || e
    );
    console.warn("Se enviará la transacción igualmente para obtener hash y revisar en el explorer.");
  }

  let gasLimit = 2_000_000n;
  try {
    gasLimit = await contract.endStake.estimateGas(fundId, amt128);
    gasLimit = (gasLimit * 12n) / 10n; // +20%
  } catch (_) {
    // fallback
  }

  try {
    const tx = await contract.endStake(fundId, amt128, { gasLimit });
    console.log("Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Receipt status:", receipt.status, "gasUsed:", receipt.gasUsed?.toString?.());
    const explorer = network.name === "shibuyaTestnet"
      ? "https://shibuya.blockscout.com/tx/"
      : "https://astar.blockscout.com/tx/";
    console.log("Explorer:", `${explorer}${tx.hash}`);
    if (receipt.status === 0) {
      console.error("La transacción fue revertida (status=0). Revisa el explorer para más detalles.");
    } else {
      console.log("endStake OK");
    }
  } catch (err) {
    const txHash = err?.transactionHash || err?.transaction?.hash;
    if (txHash) {
      const explorer = network.name === "shibuyaTestnet"
        ? "https://shibuya.blockscout.com/tx/"
        : "https://astar.blockscout.com/tx/";
      console.log("Tx hash (capturado en error):", txHash);
      console.log("Explorer:", `${explorer}${txHash}`);
    }
    console.error("endStake error:", err?.reason || err?.shortMessage || err?.message || err);
    throw err;
  }
}

async function showFund(contract, fundId) {
  const f = await contract.getFund(fundId);
  console.log("Estado del fondo:", {
    fundType: Number(f[0]),
    owner: f[1],
    startTime: Number(f[2]),
    endTime: Number(f[3]),
    privileged: f[4],
    beneficiaries: f[5],
    balance: f[6].toString(),
    stakedBalance: f[7].toString(),
    active: f[8],
  });
}

// --- Nuevas utilidades para probar los getters getFundsByUser e isUserInFund ---
async function showUserFunds(contract, userAddress) {
  const funds = await contract.getFundsByUser(userAddress);
  const fundList = funds.map((x) => Number(x));
  console.log(`getFundsByUser(${userAddress}) ->`, fundList);
}

async function checkUserInFund(contract, fundId, userAddress) {
  const inFund = await contract.isUserInFund(userAddress, fundId);
  console.log(`isUserInFund(${userAddress}, ${fundId}) ->`, inFund);
  return inFund;
}

async function showParticipantsStatus(contract, fundId) {
  const f = await contract.getFund(fundId);
  const ZERO = hre.ethers.ZeroAddress;
  // Combinar privilegiados y beneficiarios, eliminando duplicados y direcciones cero
  const participants = [...f[4], ...f[5]]
    .filter((addr) => addr && addr !== ZERO);
  const unique = Array.from(new Set(participants));

  console.log(`Participantes registrados para fundId=${fundId}:`, unique);
  for (const addr of unique) {
    await checkUserInFund(contract, fundId, addr);
  }
}

async function main() {
  const networkName = network.name;
  if (networkName !== "astarMainnet" && networkName !== "shibuyaTestnet") {
    throw new Error(`Red no soportada para WorkAstar: ${networkName}`);
  }

  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  console.log(`Network: ${networkName}, Deployer: ${deployer}`);

  const contract = await ensureContract(networkName, signer);

  // Validar que es modo nativo
  const tokenAddr = await contract.token();
  if (tokenAddr !== ethers.ZeroAddress) {
    throw new Error(`token != address(0). Este script es solo para modo nativo en Astar.`);
  }

  const fundId = await createFund(contract, { address: deployer });
  await depositNative(contract, fundId, DEFAULT_DEPOSIT);

  const canStake = await setDappTarget(contract, fundId);
  if (canStake) {
    await stake(contract, fundId, DEFAULT_STAKE);
    // Prueba de fin de staking
    await endStake(contract, fundId, DEFAULT_STAKE);
  }

  await showFund(contract, fundId);

  // Probar nuevos getters añadidos al contrato
  await showParticipantsStatus(contract, fundId);
  await showUserFunds(contract, deployer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});