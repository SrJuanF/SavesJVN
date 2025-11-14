// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IDAppStaking.sol";

/**
 * @title SavesJVN
 * @notice Contrato para fondos de ahorro con soporte multi-red:
 *  - En Celo: depósitos con token ERC20 (cCOP)
 *  - En Astar: depósitos con moneda nativa (ASTR) y "staking" contable con penalización por tiempo
 *
 * Importante: El "staking" aquí es interno del contrato (contable), no interactúa con el sistema de dApp staking de Astar.
 */
contract SavesJVN {
    error InvalidArrayLength();
    error InvalidFundTypeDuration();
    error NotOwnerOrPrivileged();
    error NotPrivileged();
    error NotBeneficiary();
    error FundNotActive();
    error FundNotFound();
    error NotMatured();
    error TokenRequired();
    error NativeRequired();
    error AmountExceedsAvailable();
    error OnlyOwner();
    error NativeTransferFailed();
    error TokenTransferFailed();
    error DappTargetNotSet();

    enum FundType {
        PensionVoluntaria,
        AhorroUniversitario
    }

    struct Fund {
        FundType fundType;
        address owner;
        uint64 startTime;
        uint64 endTime; // timestamp de finalización
        address[4] privileged; // wallets con privilegio (staking y retiro al cumplir tiempo)
        address[4] beneficiaries; // wallets beneficiarias
        uint256 balance; // saldo total del fondo (depósitos - retiros + retornos de staking)
        uint256 stakedBalance; // saldo "en staking" contable
        address dappTarget;
        bool active;
    }

    // Token ERC20 usado para depósitos en Celo. Si es address(0), el contrato opera en modo "nativo" (ASTR en Astar)
    address public immutable token;
    address private immutable Owner;
    // Penalización de tiempo (en segundos) aplicada según reglas de negocio (p.e. 6 meses)
    uint64 public immutable penaltyDuration;

    uint256 public nextFundId;
    mapping(uint256 => Fund) public funds;

    // Mapea un usuario (wallet) a los IDs de fondos en los que participa
    // como "privileged" o "beneficiary".
    mapping(address => uint256[]) private fundsByUser;
    // Ayuda a evitar duplicados cuando un usuario aparece en ambas listas.
    mapping(address => mapping(uint256 => bool)) private userInFund;

    // Dirección del precompile DApps Staking V3 (Astar/Shibuya)
    address constant DAPPS_STAKING_V3 =
        0x0000000000000000000000000000000000005001;

    event FundCreated(
        uint256 indexed fundId,
        FundType fundType,
        address indexed owner,
        uint64 startTime,
        uint64 endTime
    );
    event Deposited(
        uint256 indexed fundId,
        address indexed from,
        uint256 amount,
        bool native
    );
    event Staked(address indexed user, uint256 indexed fundId, uint256 amount);
    event Unstaked(
        address indexed user,
        uint256 indexed fundId,
        uint256 amount,
        uint256 penalty
    );
    event Withdrawn(
        address indexed user,
        uint256 indexed fundId,
        address indexed to,
        uint256 amount
    );

    modifier onlyOwner() {
        if (msg.sender != Owner) revert OnlyOwner();
        _;
    }

    constructor(address tokenAddress, uint64 _penaltyDurationSeconds) {
        token = tokenAddress;
        penaltyDuration = _penaltyDurationSeconds;
        Owner = msg.sender;
    }

    // -------- Helpers --------
    function _isInArray(
        address[4] memory arr,
        address who
    ) internal pure returns (bool) {
        for (uint8 i = 0; i < 4; i++) {
            if (arr[i] == who) return true;
        }
        return false;
    }

    function _sendTokens(address to, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Enviar ASTR nativa
            (bool ok, ) = to.call{value: amount}("");
            if (!ok) revert NativeTransferFailed();
        } else {
            // Enviar token ERC20
            (bool ok, ) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", to, amount)
            );
            if (!ok) revert TokenTransferFailed();
        }
    }

    // -------- Creación de fondos --------
    /**
     * @notice Crea un nuevo fondo con parámetros de tipo y duración.
     * @param fundType PensionVoluntaria o AhorroUniversitario
     * @param durationSeconds Duración en segundos (mín. 5 años en segundos para PensionVoluntaria, sin mínimo para AhorroUniversitario)
     * @param privilegedWallets Hasta 4 wallets con privilegio
     * @param beneficiaryWallets Hasta 4 wallets beneficiarias
     */
    function createFund(
        FundType fundType,
        uint64 durationSeconds,
        address[4] calldata privilegedWallets,
        address[4] calldata beneficiaryWallets
    ) external returns (uint256 fundId) {
        if (privilegedWallets.length > 4 || beneficiaryWallets.length > 4) {
            revert InvalidArrayLength();
        }
        // Para PensionVoluntaria se requiere mínimo 5 años expresados en segundos
        if (
            fundType == FundType.PensionVoluntaria &&
            durationSeconds < uint64(5 * 365 days)
        ) {
            revert InvalidFundTypeDuration();
        }

        uint64 start = uint64(block.timestamp);
        uint64 end;
        // Para pruebas: permitir duración corta (15 minutos) cuando fundType es AhorroUniversitario y durationSeconds == 0
        if (fundType == FundType.AhorroUniversitario && durationSeconds == 0) {
            end = start + uint64(5 minutes);
        } else {
            end = start + durationSeconds;
        }

        fundId = nextFundId++;
        Fund storage f = funds[fundId];
        f.fundType = fundType;
        f.owner = msg.sender;
        f.startTime = start;
        f.endTime = end;
        f.privileged = privilegedWallets;
        f.beneficiaries = beneficiaryWallets;
        f.active = true;

        // Registrar relación usuario-fondo para privilegiados y beneficiarios
        for (uint256 i = 0; i < privilegedWallets.length; i++) {
            address u = privilegedWallets[i];
            if (u != address(0) && !userInFund[u][fundId]) {
                userInFund[u][fundId] = true;
                fundsByUser[u].push(fundId);
            }
        }
        for (uint256 j = 0; j < beneficiaryWallets.length; j++) {
            address u2 = beneficiaryWallets[j];
            if (u2 != address(0) && !userInFund[u2][fundId]) {
                userInFund[u2][fundId] = true;
                fundsByUser[u2].push(fundId);
            }
        }

        emit FundCreated(fundId, fundType, msg.sender, start, end);
    }

    /**
     * @notice Configura el contrato dApp EVM objetivo para dApp staking (solo relevante en Astar/Shibuya).
     *         Puede ser invocado por el owner del fondo o cualquier wallet privilegiada.
     */
    function setDappTarget(uint256 fundId, address dapp) external {
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if (msg.sender != f.owner && !_isInArray(f.privileged, msg.sender))
            revert NotOwnerOrPrivileged();
        f.dappTarget = dapp;
    }

    // -------- Depósitos --------
    /**
     * @notice Depósito usando token ERC20 (p.e. cCOP en Celo). Requiere token != address(0) y aprobación previa.
     */
    function depositToken(uint256 fundId, uint256 amount) external {
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if (!f.active) revert FundNotActive();
        if (token == address(0)) revert TokenRequired();
        if (amount == 0) revert AmountExceedsAvailable();

        //Necesita aprove previo
        // transferFrom
        (bool ok1, bytes memory data1) = token.call(
            abi.encodeWithSelector(
                bytes4(keccak256("transferFrom(address,address,uint256)")),
                msg.sender,
                address(this),
                amount
            )
        );
        require(
            ok1 && (data1.length == 0 || abi.decode(data1, (bool))),
            "ERC20 transferFrom failed"
        );

        f.balance += amount;
        emit Deposited(fundId, msg.sender, amount, false);
    }

    /**
     * @notice Depósito usando moneda nativa (p.e. ASTR en Astar). Requiere token == address(0).
     */
    function depositNative(uint256 fundId) external payable {
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if(token != address(0)) revert NativeRequired();
        if (!f.active) revert FundNotActive();
        if (msg.value == 0) revert AmountExceedsAvailable();

        f.balance += msg.value;
        emit Deposited(fundId, msg.sender, msg.value, true);
    }

    // -------- Staking (solo modo nativo / Astar) --------
    function stakeASTR(uint256 fundId, uint128 amount) external {
        if (token != address(0)) revert NativeRequired();
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if (!f.active) revert FundNotActive();
        if (!_isInArray(f.privileged, msg.sender)) revert NotPrivileged();
        if (f.dappTarget == address(0)) revert DappTargetNotSet();

        uint256 available = f.balance - f.stakedBalance;
        if (amount == 0 || amount > available) revert AmountExceedsAvailable();
        if (address(this).balance < amount) revert NativeTransferFailed();

        {
            try DAppStaking(DAPPS_STAKING_V3).lock(amount) returns (bool ok) {
                require(ok, "lock failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("lock error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }
        {
            DAppStaking.SmartContract memory target = DAppStaking
                .SmartContract({
                    contract_type: DAppStaking.SmartContractType.EVM,
                    contract_address: abi.encodePacked(f.dappTarget)
                });
            try DAppStaking(DAPPS_STAKING_V3).stake(target, amount) returns (
                bool ok
            ) {
                require(ok, "stake failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("stake error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }

        // Contablemente movemos fondos a "staked"
        f.stakedBalance += amount;
        emit Staked(msg.sender, fundId, amount);
    }

    function endStake(uint256 fundId, uint128 amount) external {
        if (token != address(0)) revert NativeRequired();
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if (!f.active) revert FundNotActive();
        if (!_isInArray(f.privileged, msg.sender)) revert NotPrivileged();
        if (f.dappTarget == address(0)) revert DappTargetNotSet();
        if (amount == 0 || amount > f.stakedBalance)
            revert AmountExceedsAvailable();

        {
            DAppStaking.SmartContract memory target = DAppStaking
                .SmartContract({
                    contract_type: DAppStaking.SmartContractType.EVM,
                    contract_address: abi.encodePacked(f.dappTarget)
                });
            try DAppStaking(DAPPS_STAKING_V3).unstake(target, amount) returns (
                bool ok
            ) {
                require(ok, "unstake failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("unstake error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }
        {
            try DAppStaking(DAPPS_STAKING_V3).unlock(amount) returns (bool ok) {
                require(ok, "unlock failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("unlock error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }
        // Contablemente reducimos el staked
        f.stakedBalance -= amount;
        // Por ahora no aplicamos penalización adicional aquí (puede definirse según reglas de negocio)
        emit Unstaked(msg.sender, fundId, amount, 0);
    }

    // -------- Retiros (al cumplir tiempo) --------
    function withdrawToBeneficiary(
        uint256 fundId,
        uint256 amount,
        address to
    ) external {
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        if (!f.active) revert FundNotActive();
        if (!_isInArray(f.privileged, msg.sender)) revert NotPrivileged();
        if (block.timestamp < f.endTime) revert NotMatured();

        // disponible = balance - stakedBalance (no permitir retiro de lo que sigue stakeado)
        uint256 available = f.balance - f.stakedBalance;
        if (amount == 0 || amount > available) revert AmountExceedsAvailable();

        f.balance -= amount;

        if (token == address(0)) {
            // nativo
            (bool sent, ) = to.call{value: amount}("");
            require(sent, "Native transfer failed");
        } else {
            // token ERC20
            (bool ok, bytes memory data) = token.call(
                abi.encodeWithSelector(
                    bytes4(keccak256("transfer(address,uint256)")),
                    to,
                    amount
                )
            );
            require(
                ok && (data.length == 0 || abi.decode(data, (bool))),
                "ERC20 transfer failed"
            );
        }

        emit Withdrawn(msg.sender, fundId, to, amount);
    }

    // -------- Utilidades --------
    /**
     * @notice Devuelve los IDs de fondos en los que participa el usuario
     *         ya sea como privilegiado o beneficiario.
     */
    function getFundsByUser(address user) external view returns (uint256[] memory) {
        return fundsByUser[user];
    }

    /**
     * @notice Indica si un usuario participa en un fondo específico (privilegiado o beneficiario).
     */
    function isUserInFund(address user, uint256 fundId) external view returns (bool) {
        return userInFund[user][fundId];
    }
    function getFund(
        uint256 fundId
    )
        external
        view
        returns (
            FundType fundType,
            address owner,
            uint64 startTime,
            uint64 endTime,
            address[4] memory privileged,
            address[4] memory beneficiaries,
            uint256 balance,
            uint256 stakedBalance,
            bool active
        )
    {
        Fund storage f = funds[fundId];
        if (f.owner == address(0)) revert FundNotFound();
        return (
            f.fundType,
            f.owner,
            f.startTime,
            f.endTime,
            f.privileged,
            f.beneficiaries,
            f.balance,
            f.stakedBalance,
            f.active
        );
    }

    function _getRevertMsg(
        bytes memory returnData
    ) internal pure returns (string memory) {
        if (returnData.length < 68) return "call failed";
        assembly {
            returnData := add(returnData, 0x04)
        }
        return abi.decode(returnData, (string));
    }

    receive() external payable {}
}
