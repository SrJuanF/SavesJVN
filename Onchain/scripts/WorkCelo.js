const hre = require("hardhat");
const { ethers, getNamedAccounts, network, deployments } = hre;

// Direcciones de cCOP
const CELO_MAINNET_CCOP = "0x434563B0604BE100F04B7Ae485BcafE3c9D8850E";
const CELO_SEPOLIA_CCOP = "0xEd9A3541f06E45E3d92E937AA74eD878127318E0";

const SIX_MONTHS_SECONDS = 180 * 24 * 60 * 60;
const DEFAULT_DEPOSIT = "1"; // 1 cCOP (asumiendo 18 decimales)

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
];

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
      `No se encontró un deployment de SavesJVN para la red "${networkName}". Despliega primero con el script de deploy correspondiente (p.ej. 'deploy_Celo.js').`
    );
  }

  const SavesJVN = await ethers.getContractFactory("SavesJVN", signer);
  console.log(`Usando contrato desplegado en ${networkName}: ${deployed.address}`);
  return SavesJVN.attach(deployed.address).connect(signer);
}

async function resolveToken(networkName) {
  if (networkName === "celoMainnet") return CELO_MAINNET_CCOP;
  if (networkName === "celoSepolia") return CELO_SEPOLIA_CCOP;
  throw new Error(`Red no soportada para WorkCelo: ${networkName}`);
}

async function createFund(contract, deployer) {
  const ZERO = ethers.ZeroAddress;
  const privileged = [deployer.address, ZERO, ZERO, ZERO];
  const beneficiaries = [deployer.address, ZERO, ZERO, ZERO];
  const fundType = 1; // PensionVoluntaria
  const durationSeconds = 0;//BigInt(5 * 365 * 24 * 60 * 60); // mínimo 5 años, expresado en segundos
  const tx = await withRetry(() => contract.createFund(fundType, durationSeconds, privileged, beneficiaries));
  await withRetry(() => tx.wait());
  const nextId = await withRetry(() => contract.nextFundId());
  const fundId = Number(nextId - 1n);
  console.log(`Fondo creado: fundId=${fundId}`);
  return fundId;
}

async function depositToken(contract, fundId, tokenAddress, amountStr, signer, deployerAddress) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);

  const bal = await token.balanceOf(deployerAddress);
  console.log(`Balance del deployer en cCOP: ${ethers.formatUnits(bal, decimals)}`);
  if (bal < amount) {
    console.warn("Saldo insuficiente para depositar. Aborta prueba de depósito.");
    return false;
  }

  // Aprobación previa
  console.log(`Aprobando ${amountStr} cCOP (${amount} unidades) para el contrato...`);
  const txApprove = await withRetry(() => token.approve(contract.target, amount));
  await withRetry(() => txApprove.wait());
  const allowance = await token.allowance(deployerAddress, contract.target);
  console.log("Allowance actual:", ethers.formatUnits(allowance, decimals));
  if (allowance < amount) {
    throw new Error("Allowance insuficiente tras approve.");
  }

  // Depósito
  console.log(`Depositando token cCOP en fundId=${fundId} monto=${amountStr}`);
  const tx = await withRetry(() => contract.depositToken(fundId, amount));
  await withRetry(() => tx.wait());
  console.log("Depósito de token OK");
  return true;
}

async function attemptWithdraw(contract, fundId, tokenAddress, amountStr, signer, deployerAddress) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const decimals = await token.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);
  console.log(`Intentando withdrawToBeneficiary (se espera NotMatured si aún no alcanza endTime)...`);
  try {
    const tx = await withRetry(() => contract.withdrawToBeneficiary(fundId, amount, deployerAddress));
    await withRetry(() => tx.wait());
    console.log("Withdraw ejecutado OK (no esperado si endTime no ha pasado)");
  } catch (err) {
    console.warn("Withdraw revertido como se esperaba:", err?.reason || err?.message || err);
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
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  console.log(`Network: ${networkName}, Deployer: ${deployer}`);

  const tokenAddress = await resolveToken(networkName);
  const contract = await ensureContract(networkName, signer);

  // Validar que es modo token
  const tokenAddrOnchain = await contract.token();
  if (tokenAddrOnchain.toLowerCase() !== tokenAddress.toLowerCase()) {
    throw new Error(`token del contrato (${tokenAddrOnchain}) no coincide con el esperado (${tokenAddress}).`);
  }

  const fundId = await createFund(contract, { address: deployer });

  const didDeposit = await depositToken(contract, fundId, tokenAddress, process.env.CELO_DEPOSIT_CCOP || DEFAULT_DEPOSIT, signer, deployer);
  if (didDeposit) {
    await attemptWithdraw(contract, fundId, tokenAddress, process.env.CELO_DEPOSIT_CCOP || DEFAULT_DEPOSIT, signer, deployer);
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