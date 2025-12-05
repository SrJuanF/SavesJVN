// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Interfaces/ICeloStaking.sol";
import "../Interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingCelo is Ownable, ReentrancyGuard {
    // Contracts Addresses
    CeloStakingAccount private immutable ACCOUNT;
    CeloStakingGold private immutable LOCKED_GOLD;
    CeloStakingElection private immutable ELECTION;
    swapcCopCelo private immutable SWAP;
    IERC20 private immutable CCOP;

    //Fixed Parameters
    address private constant ELECTION_GROUP =0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9;

    struct UserBalance {
        uint256 locked;
        uint256 unlocking;
        uint256 staked;
        uint256 withdrawed;
    }

    mapping(address => UserBalance) private s_balances;
    uint256 private s_withdrawsAvailable;
    mapping(address => uint256) private s_lastEpochNumber;

    event Locked(address indexed user, uint256 amount);
    event Relocked(address indexed user, uint256 index, uint256 amount);
    event Unlocked(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event WithdrawnIndex(address indexed user, uint256 index, uint256 amount);
    event Staked(address indexed account, address indexed group, uint256 value);
    event UnstakedPending(address indexed account, address indexed group, uint256 value, uint256 index);
    event UnstakedActive(address indexed account, address indexed group, uint256 value, uint256 index);
    event Activated(address indexed group);

    constructor(
        address _contractAccount,
        address _lockedGold,
        address _election,
        address _swapMento,
        address _cCopToken
    ) Ownable(msg.sender) {
        ACCOUNT = CeloStakingAccount(_contractAccount);
        LOCKED_GOLD = CeloStakingGold(_lockedGold);
        ELECTION = CeloStakingElection(_election);
        SWAP = swapcCopCelo(_swapMento);
        CCOP = IERC20(_cCopToken);
        s_withdrawsAvailable = 0;

        createAccount();
    }

    function withdrawAllToOwner() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "no balance");
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "transfer failed");
    }

    function createAccount() internal nonReentrant {
        bool ok = ACCOUNT.createAccount();
        require(ok, "Error al Crear la Cuenta");
    }

    //*******************LOCKED_GOLD********************* */

    function Fastlock(uint256 _reLockAmount) external payable nonReentrant {
        UserBalance storage user = s_balances[msg.sender];
        require(
            _reLockAmount <= user.unlocking,
            "No tienes suficiente para relock"
        );
        uint256 totalPendingUnlocking = LOCKED_GOLD.getTotalPendingWithdrawals(
            address(this)
        );
        require(
            user.unlocking <= totalPendingUnlocking,
            "No hay fondos suficiente para relock"
        );
        if (
            user.unlocking > 0 &&
            totalPendingUnlocking > 0 &&
            _reLockAmount > 0
        ) {
            user.unlocking -= _reLockAmount;
            user.locked += _reLockAmount;
            relockSource(_reLockAmount);
            
        }
        if (msg.value > 0) {
            user.locked += msg.value;
            LOCKED_GOLD.lock{value: msg.value}();
        }
        uint256 amountLocked = msg.value + _reLockAmount;
        emit Locked(msg.sender, amountLocked);
    }

    function relockSource(
        uint256 _reLockAmount
    ) private {
        (uint256[] memory values, uint256[] memory timestamps) = LOCKED_GOLD
            .getPendingWithdrawals(address(this));
        require(values.length > 0, "No hay fondos para relock");

        uint256 remainig = _reLockAmount;
        for (uint256 i = values.length - 1; i >= 0; i--) {
            if (block.timestamp < timestamps[i]) {
                uint256 varRelockAmount = values[i] >= _reLockAmount ? _reLockAmount : values[i];
                try LOCKED_GOLD.relock(i, varRelockAmount) {
                    remainig -= varRelockAmount;
                    emit Relocked(msg.sender, i, varRelockAmount);
                } catch {
                    revert("relock failed");
                }
                break;
            }
        }
        if (remainig > 0) {
            relockSource(remainig);
        }
    }

    function unlock(uint256 amount) external nonReentrant {
        UserBalance storage user = s_balances[msg.sender];
        require(amount <= user.locked, "No tienes suficiente para unlock");
        uint256 available = LOCKED_GOLD.getAccountNonvotingLockedGold(
            address(this)
        );
        require(amount <= available, "No hay fondos suficiente para unlock");
        user.locked -= amount;
        user.unlocking += amount;
        LOCKED_GOLD.unlock(amount);
        emit Unlocked(msg.sender, amount);
    }

    function withdraw(uint256 _withdrawAmount) external nonReentrant {
        UserBalance storage user = s_balances[msg.sender];
        require(user.unlocking > 0 && _withdrawAmount > 0, "_withdrawAmount en 0, o saldo en Unlocking en 0");
        require(_withdrawAmount <= user.unlocking,"No tienes suficiente para withdraw");
        uint256 totalPendingUnlocking = LOCKED_GOLD.getTotalPendingWithdrawals(
            address(this)
        );
        require(user.unlocking <= totalPendingUnlocking, "No hay fondos suficiente para withdraw");

        uint256 balA = address(this).balance;

        uint256 remaining = _withdrawAmount;

        user.unlocking -= _withdrawAmount;
        user.withdrawed += _withdrawAmount;

        if(s_withdrawsAvailable > 0){
            uint256 amount = s_withdrawsAvailable >= _withdrawAmount ? _withdrawAmount : s_withdrawsAvailable;
            remaining -= amount;
            s_withdrawsAvailable -= amount;
        }

        if(remaining > 0){
            withdrawSource(remaining);
        }

        uint256 balB = address(this).balance;
        require(balB >= _withdrawAmount, "no balance");
        require(balB > balA, "no balance increase after CeloWithdraw");
        (bool ok, ) = payable(msg.sender).call{value: _withdrawAmount}("");
        require(ok, "transfer failed");
        
        emit Withdraw(msg.sender, _withdrawAmount);
    }

    function withdrawSource(
        uint256 _withdrawAmount
    ) private {
        (uint256[] memory values, uint256[] memory timestamps) = LOCKED_GOLD
            .getPendingWithdrawals(address(this));
        require(values.length > 0, "No hay fondos para withdraw");

        uint256 remainig = _withdrawAmount;
        for (uint256 i = values.length - 1; i >= 0; i--) {
            if (block.timestamp >= timestamps[i]) {
                bool valuesMayWithdrawAmount = values[i] >= _withdrawAmount;
                uint256 varWithdrawAmount = valuesMayWithdrawAmount ? values[i] - _withdrawAmount : _withdrawAmount - values[i];

                try LOCKED_GOLD.withdraw(i) {
                    if(valuesMayWithdrawAmount){
                        remainig = 0;
                        s_withdrawsAvailable += varWithdrawAmount;

                    }else{
                        remainig = varWithdrawAmount;
                    }
                    
                    emit WithdrawnIndex(msg.sender, i, values[i]);
                } catch {
                    revert("MicroWithdraw failed");
                }
                break;
            }
        }
        if (remainig > 0) {
            withdrawSource(remainig);
        }
    }

    //**********************ELECTION*********************** */
    function activableBalance(address group) public returns(bool){
        bool activable = ELECTION.hasActivatablePendingVotes(address(this), group);
        if(activable){
            uint256 epochNumber = ELECTION.getEpochNumber();
            if(s_lastEpochNumber[group] < epochNumber){
                bool ok = ELECTION.activate(group);
                if(ok){
                    emit Activated(group);
                    return true;
                }
            }
        }
        return false;
    }
    //
    function stake(address group, uint256 value, address lesser, address greater) external nonReentrant{
        bool elegible = ELECTION.getGroupEligibility(group);
        require(elegible, "Group no elegible");

        UserBalance storage user = s_balances[msg.sender];
        require(value > 0 && user.locked > 0, "Value/Locked debe ser mayor a 0");
        uint256 lockedGold = LOCKED_GOLD.getAccountNonvotingLockedGold(address(this));
        require(value <= user.locked && value <= lockedGold, "No tienes suficientes fondos bloqueados");
        
        user.locked -= value;
        user.staked += value;
        s_lastEpochNumber[group] = ELECTION.getEpochNumber();
        bool ok = ELECTION.vote(group, value, lesser, greater);
        require(ok, "Election.vote revert");
        emit Staked(msg.sender, group, value);

        activableBalance(group);
    }

    function unstake(address group,uint256 value,address lesser,address greater,uint256 index) external nonReentrant{
        bool elegible = ELECTION.getGroupEligibility(group);
        require(elegible, "Group no elegible");

        UserBalance storage user = s_balances[msg.sender];
        require(value > 0 && value <= user.staked, "Value/Staked debe ser mayor a 0");
        uint256 totalStakedGroup = ELECTION.getTotalVotesForGroupByAccount(group, address(this));
        require(value <= totalStakedGroup, "Value mayor a Total Staked Group");

        uint256 pendingVotes = ELECTION.getPendingVotesForGroupByAccount(group, address(this));

        uint256 remaining = value;

        user.staked -= value;
        user.locked += value;

        if(pendingVotes > 0){
            uint256 availableToUnstake = pendingVotes > value ? value : pendingVotes;
            remaining -= availableToUnstake;
            bool pendingRevoked = ELECTION.revokePending(group, availableToUnstake, lesser, greater, index);
            require(pendingRevoked, "ELECTION.revokePending revert");
            emit UnstakedPending(msg.sender, group, availableToUnstake, index);
        }

        if(remaining > 0){
            bool activeRevoked = ELECTION.revokeActive(group, remaining, lesser, greater, index);
            require(activeRevoked, "ELECTION.revokeActive revert");
            emit UnstakedActive(msg.sender, group, remaining, index);
        }

        user.locked -= value;
        user.unlocking += value;
        LOCKED_GOLD.unlock(value);
        emit Unlocked(msg.sender, value);

        activableBalance(group);
    }

    //********GETTERS********** */
    function getBalance(
        address _user
    ) external view returns (UserBalance memory) {
        return s_balances[_user];
    }
}
