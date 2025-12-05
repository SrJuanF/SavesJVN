const { deployments, ethers, network, getNamedAccounts } = require("hardhat");
const { networkConfig } = require("../../helper-hardhat-config.js");

// Inicialización global (se asignan dentro de main según la red actual)
let LOCKED_GOLD = null;
let ELECTION = null;
let VALIDATORS = null;
const ZERO_ADDRESS = ethers.ZeroAddress;
const ELECTION_GROUP_MAINNET = "0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9";

// ABIs mínimos para llamadas de lectura necesarias (ethers v6 acepta ABI como array de fragmentos)
const LockedGoldAbi = [
  "function getTotalLockedGold() external view returns (uint256)",
  "function getAccountNonvotingLockedGold(address account) view returns (uint256)",
  "function getAccountTotalLockedGold(address account) view returns (uint256)",
  "function getTotalPendingWithdrawals(address account) view returns (uint256)",
  "function unlockingPeriod() external view returns (uint256)",
];
const ElectionAbi = [
  "function activate(address group) external returns (bool)",
  "function getTotalVotesForEligibleValidatorGroups() external view returns (address[] memory groups, uint256[] memory values)",
  "function getTotalVotesForGroupByAccount(address group,address account) view returns (uint256)",
  "function getActiveVotesForGroupByAccount(address group,address account) view returns (uint256)",
  "function getPendingVotesForGroupByAccount(address group,address account) view returns (uint256)",
  "function getGroupEligibility(address group) view returns (bool)",
  "function getActiveVotesForGroup(address group) external view returns (uint256)",
  "function getEpochNumber() external view returns (uint256)",
  "function activateForAccount(address group, address account) external returns (bool)",
];
const ValidatorsAbi = [
  "function getRegisteredValidators() external view returns (address[] memory)",
  "function getValidator(address account) external view returns (bytes memory, bytes memory, address, uint256, address)",
];

async function main() {
  // Validar que solo se ejecute en redes de Celo (Mainnet y Sepolia)
  const chainId = network.config.chainId;
  const isCeloNetwork = chainId === 42220 || chainId === 11142220;
  if (!isCeloNetwork) {
    throw new Error(
      `Esta acción de staking es solo para redes de Celo. Red actual: ${network.name} (chainId=${chainId})`
    );
  }
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const stakingDeployment = await deployments.get("StakingCelo");
  const staking = await ethers.getContractAt(
    "StakingCelo",
    stakingDeployment.address,
    signer
  );

  // Instanciar contratos Celo (LockedGold y Election) según helper-hardhat-config y la red actual
  const cfg = networkConfig[chainId];
  if (!cfg)
    throw new Error(
      `No hay configuración para chainId=${chainId} en helper-hardhat-config.js`
    );
  if (!cfg.celoLockedGold || !cfg.celoElection) {
    throw new Error(
      `Faltan direcciones de celoLockedGold/celoElection para chainId=${chainId}`
    );
  }
  LOCKED_GOLD = await ethers.getContractAt(
    LockedGoldAbi,
    cfg.celoLockedGold,
    signer
  );
  ELECTION = await ethers.getContractAt(ElectionAbi, cfg.celoElection, signer);
  VALIDATORS = await ethers.getContractAt(
    ValidatorsAbi,
    cfg.celoValidators,
    signer
  );

  // Helper para manejar transacciones y decodificar eventos, mostrando errores claros
  async function handleTx(txPromise, expectedEvents = []) {
    try {
      const tx = await txPromise;
      const receipt = await tx.wait();
      const ok = receipt.status === 1;
      console.log(`Tx enviada: ${tx.hash} | status=${receipt.status}`);
      // Decodificar eventos del contrato si se esperan algunos
      if (expectedEvents && expectedEvents.length > 0) {
        // Usar exclusivamente la address del deployment (L16) para la verificación
        let stakingAddress = null;
        try {
          stakingAddress = ethers.getAddress(stakingDeployment.address);
        } catch (_) {
          stakingAddress = null;
        }
        const logs = Array.isArray(receipt.logs) ? receipt.logs : [];
        const matchedEvents = [];
        for (const log of logs) {
          if (typeof log?.address !== "string") continue;
          let addr;
          try {
            addr = ethers.getAddress(log.address);
          } catch {
            continue; // dirección inválida/no checksummed: ignorar
          }
          if (stakingAddress && addr === stakingAddress) {
            try {
              const parsed = staking.interface.parseLog(log);
              if (expectedEvents.includes(parsed.name)) {
                matchedEvents.push({ name: parsed.name, args: parsed.args });
              }
            } catch (_) {
              // Ignorar logs que no correspondan a la ABI de StakingCelo
            }
          }
        }
        if (matchedEvents.length > 0) {
          console.log("Eventos decodificados:");
          for (const ev of matchedEvents) {
            console.log(`- ${ev.name}:`, ev.args);
          }
        } else {
          console.warn(
            "No se encontraron eventos esperados en los logs de la transacción."
          );
        }
      }
      if (!ok) {
        throw new Error("La transacción se minó con status 0 (fallida)");
      }
      return receipt;
    } catch (err) {
      const msg =
        err?.error?.message || err?.reason || err?.message || String(err);
      console.error("Error en transacción:", msg);
      if (err?.transactionHash) {
        console.error("txHash:", err.transactionHash);
      }
      throw err;
    }
  }

  // Utilidad para sumar BigInt en arrays
  const bigIntSum = (items) => items.reduce((acc, v) => acc + BigInt(v), 0n);
  // Obtiene los detalles de cada validador (clave pública, afiliación, score, signer)
  async function fetchValidatorDetails(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) return [];
    const calls = addresses.map((addr) => VALIDATORS.getValidator(addr));
    const validatorDetailsRaw = await Promise.all(calls);
    // Mapear resultados al mismo formato que el código original de wagmi/viem
    return validatorDetailsRaw.map((result, i) => {
      if (!result)
        throw new Error(`Faltan detalles del validador para índice ${i}`);
      const [ecdsaPublicKey, blsPublicKey, affiliation, score, signer] = result;
      return { ecdsaPublicKey, blsPublicKey, affiliation, score, signer };
    });
  }
  // Obtiene votos por grupos elegibles y el total de CELO bloqueado
  async function fetchVotesAndTotalLocked() {
    const [groups, values] =
      await ELECTION.getTotalVotesForEligibleValidatorGroups();
    if (
      !Array.isArray(groups) ||
      groups.length === 0 ||
      !Array.isArray(values)
    ) {
      throw new Error("Error al obtener votos de grupos elegibles");
    }
    const totalLocked = await LOCKED_GOLD.getTotalLockedGold();
    const eligibleGroups = groups;
    const groupVotes = values;
    const totalVotes = bigIntSum(groupVotes);
    return { eligibleGroups, groupVotes, totalLocked, totalVotes };
  }
  async function setVotesForIneligibleGroups(groups) {
    const groupsArray = Object.values(groups);
    const ineligibleGroups = groupsArray
      .filter((g) => g.votes === 0n)
      .filter((g) => g.eligible === false);

    if (ineligibleGroups.length === 0) {
      return groupsArray;
    }

    const votes = await Promise.all(
      ineligibleGroups.map((group) => ELECTION.getActiveVotesForGroup(group.address))
    );
    const activeVotesIneligibleGroups = votes.map((entry) => entry);

    const modifiedGroups = mergeVotesWithGroups(
      ineligibleGroups,
      activeVotesIneligibleGroups,
      groups
    );

    return Object.values(modifiedGroups);
  }
  function mergeVotesWithGroups(
    ineligibleGroupsWhichStillHaveElectedMembers,
    activeVotesIneligibleGroups,
    groups
  ) {
    if (
      ineligibleGroupsWhichStillHaveElectedMembers.length !==
      activeVotesIneligibleGroups.length
    ) {
      console.error("length mismatch between groups and active votes");
      return groups;
    }
    const groupsAfterUpdates = { ...groups };
    ineligibleGroupsWhichStillHaveElectedMembers.forEach((group, i) => {
      const votes = activeVotesIneligibleGroups[i];
      if (typeof votes === "bigint") {
        // add the votes for groups that are ineligible but still have votes
        // note this modifies the original groups object
        groupsAfterUpdates[group.address].votes = votes;
      }
    });
    return groupsAfterUpdates;
  }
  // Función dedicada que arma el mapa de grupos con sus miembros y votos
  async function fetchValidatorGroupInfo() {
    try {
      const validatorAddrs = await VALIDATORS.getRegisteredValidators();
      if (!Array.isArray(validatorAddrs) || validatorAddrs.length === 0) {
        throw new Error("No se encontraron validadores registrados");
      }
      console.debug(`Found ${validatorAddrs.length} validators`);
      const validatorDetails = await fetchValidatorDetails(validatorAddrs);

      if (validatorAddrs.length !== validatorDetails.length) {
        throw new Error(
          "El tamaño de la lista de validadores y sus detalles no coincide"
        );
      }

      // Procesar lista de validadores para crear el mapa de grupos
      const groups = {};
      for (let i = 0; i < validatorAddrs.length; i++) {
        const valAddr = validatorAddrs[i];
        const valDetails = validatorDetails[i];
        const groupAddr = valDetails.affiliation;
        // Crear grupo si no existe aún
        if (!groups[groupAddr]) {
          groups[groupAddr] = {
            address: groupAddr,
            members: {},
            eligible: false,
            votes: 0n,
          };
        }
        // Registrar miembro del grupo
        const validator = {
          address: valAddr,
          signer: valDetails.signer,
        };
        groups[groupAddr].members[valAddr] = validator;
      }

      // Remover el grupo "nulo" de validadores sin afiliación
      if (groups[ZERO_ADDRESS]) {
        delete groups[ZERO_ADDRESS];
      }

      // Obtener detalles de votos y total bloqueado
      const { eligibleGroups, groupVotes, totalLocked, totalVotes } =
        await fetchVotesAndTotalLocked();

      // Marcar los grupos elegibles y asignar sus votos
      for (let i = 0; i < eligibleGroups.length; i++) {
        const groupAddr = eligibleGroups[i];
        const group = groups[groupAddr];
        if (group) {
          group.votes = groupVotes[i];
          group.eligible = true;
        }
      }
      //const groupList = Object.values(groups);
      const groupsWithIneligibleVotes =
        await setVotesForIneligibleGroups(groups);
      return {
        groups: groupsWithIneligibleVotes,
        addressToGroup: groups,
        totalLocked,
        totalVotes,
      };
    } catch (e) {
      console.warn(
        "Warn: no se pudo obtener información de grupos de validadores:",
        e?.message || String(e)
      );
      return { groups: {}, totalLocked: 0n, totalVotes: 0n };
    }
  }
  // Calcula lesser/greater suponiendo que se emitirá un voto adicional (voteWeight) para targetGroup
  function findLesserAndGreaterAfterVote(groupsArr, targetGroup, voteWeight) {
    const sortedGroups = [...groupsArr].sort((a, b) => {
      if (a.votes === b.votes) return 0;
      return b.votes > a.votes ? 1 : -1; // descendente
    });
    const eqAddress = (a, b) => {
      try {
        return ethers.getAddress(a) === ethers.getAddress(b);
      } catch {
        return false;
      }
    };
    const selectedGroup = sortedGroups.find((g) =>
      eqAddress(targetGroup, g.address)
    );
    const voteTotal = (selectedGroup?.votes || 0n) + BigInt(voteWeight);
    let greater = ZERO_ADDRESS;
    let lesser = ZERO_ADDRESS;

    // sortedGroups debe estar ordenado descendente (mayor a menor)
    for (const g of sortedGroups) {
      if (eqAddress(g.address, targetGroup)) continue;
      if (BigInt(g.votes) < voteTotal) {
        lesser = g.address;
        break;
      }
      greater = g.address;
    }
    
    return { lesser, greater };
  }

  function activableBalance(group) {
    console.log("Llamando a activableBalance...");
    return handleTx(staking.activableBalance(group), ["Activated"]);
  }

  // 1) Fastlock: relock de fondos pendientes y opcionalmente lock nuevo (msg.value)
  async function fastlock(relockAmountWei, ethToLockWei = 0) {
    console.log("Llamando Fastlock...");
    return handleTx(
      staking.Fastlock(relockAmountWei, { value: ethToLockWei }),
      ["Relocked", "Locked"]
    );
  }
  // 2) Unlock: mueve fondos de locked a unlocking
  async function unlock(amountWei) {
    console.log("Llamando unlock...");
    return handleTx(staking.unlock(amountWei), ["Unlocked"]);
  }
  // 3) Withdraw: retira fondos disponibles (liberados) hacia el usuario
  async function withdraw(amountWei) {
    console.log("Llamando withdraw...");
    return handleTx(staking.withdraw(amountWei), [
      "Withdraw",
      "WithdrawnIndex",
    ]);
  }
  // 4) Stake: vota por un grupo con fondos bloqueados
  async function stake(
    targetGroup,
    valueWei,
    groups
  ) {
    const { lesser, greater } = findLesserAndGreaterAfterVote(groups, targetGroup, valueWei);
    console.log("Llamando stake...");
    return handleTx(staking.stake(targetGroup, valueWei, lesser, greater), [
      "Staked",
      "Activated"
    ]);
  }
  // 5) Unstake: revoca votos (pending/active) y devuelve a locked
  async function unstake(
    targetGroup,
    valueWei,
    index = 0, // Indice en groupsVotedByAccount -> Lista de Grupos votados por un usuario
    groups
  ) {

  const { lesser, greater } = findLesserAndGreaterAfterVote(groups, targetGroup, valueWei * -1n);
    console.log("Llamando unstake...");
    return handleTx(staking.unstake(targetGroup, valueWei, lesser, greater, index), [
      "UnstakedPending",
      "UnstakedActive",
    ]);
  }
  // 6) Solo Owner: WithdrawAllToOwner
  async function withdrawAllToOwner() {
    console.log("Llamando withdrawAllToOwner (solo owner)...");
    return handleTx(staking.withdrawAllToOwner());
  }
  // 7) Getter: obtener balances de un usuario
  async function getBalance(user = deployer) {
    try {
      const bal = await staking.getBalance(user);
      // Normalizar valores: devolver en wei y en CELO (ether units)
      const result = {
        locked: ethers.formatEther(bal.locked),
        unlocking: ethers.formatEther(bal.unlocking),
        staked: ethers.formatEther(bal.staked),
        withdrawed: ethers.formatEther(bal.withdrawed),
      };
      console.log("Balance", result);
      return result;
    } catch (err) {
      const msg =
        err?.error?.message || err?.reason || err?.message || String(err);
      console.error("Error en getBalance:", msg);
      throw err;
    }
  }
  // 8) Función dedicada: imprimir métricas normalizadas de LockedGold y Election
  async function printCeloStakingStats(
    account = stakingDeployment.address,
    group
  ) {
    try {
      const acct = ethers.getAddress(account);
      const grp = ethers.getAddress(group);

      // LockedGold
      const nonVotingWei = await LOCKED_GOLD.getAccountNonvotingLockedGold(acct);
      const totalLockedWei = await LOCKED_GOLD.getAccountTotalLockedGold(acct);
      const totalPendingWei = await LOCKED_GOLD.getTotalPendingWithdrawals(acct);
      const unlockingPeriod = await LOCKED_GOLD.unlockingPeriod();
      const unlockingHoras = BigInt(unlockingPeriod) / 3600n;

      // Election (votos por grupo y cuenta)
      const totalVotesGroupWei = await ELECTION.getTotalVotesForGroupByAccount(
        grp,
        acct
      );
      const activeVotesGroupWei =
        await ELECTION.getActiveVotesForGroupByAccount(grp, acct);
      const pendingVotesGroupWei =
        await ELECTION.getPendingVotesForGroupByAccount(grp, acct);
      const epochNumber = await ELECTION.getEpochNumber();

      const out = {
        lockedGold: {
          nonVoting: ethers.formatEther(nonVotingWei),
          totalLocked: ethers.formatEther(totalLockedWei),
          totalPendingWithdrawals: ethers.formatEther(totalPendingWei),
          unlockingPeriodHoras: unlockingHoras.toString(),
        },
        election: {
          totalVotesForGroupByAccount: ethers.formatEther(totalVotesGroupWei),
          activeVotesForGroupByAccount: ethers.formatEther(activeVotesGroupWei),
          pendingVotesForGroupByAccount: ethers.formatEther(pendingVotesGroupWei),
          epochNumber: epochNumber.toString(),
        },
      };

      console.log("Celo Staking Stats (normalizado a CELO):", out);
      return out;
    } catch (err) {
      const msg =
        err?.error?.message || err?.reason || err?.message || String(err);
      console.error("Error en printCeloStakingStats:", msg);
      throw err;
    }
  }

  // Ejemplo: obtener y mostrar información de grupos validador(es)
  const { groups, addressToGroup, totalLocked, totalVotes } = await fetchValidatorGroupInfo();
  const amountWei = ethers.parseEther("0.01");
  const TargetGroup = chainId === 11142220 ? groups[0].address : ELECTION_GROUP_MAINNET;

  await getBalance(deployer);
  // Ejemplo: imprimir métricas de LockedGold y Election para el contrato StakingCelo y el grupo fijo
  await printCeloStakingStats(stakingDeployment.address, TargetGroup);

  //await fastlock(ethers.parseEther("0"), ethers.parseEther("0.03"));
  //await unlock(ethers.parseEther("0.04"));
  // await withdraw(ethers.parseEther("0.02"));

  //await stake(TargetGroup, amountWei, groups);
  //await activableBalance(TargetGroup);
  //await unstake(TargetGroup, amountWei, 0, groups);
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
