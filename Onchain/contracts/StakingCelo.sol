// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import './ICeloStaking.sol';

contract StakingCelo {
    CeloStakingGold private constant LOCKED_GOLD = CeloStakingGold(0x55E1A0C8f376964bd339167476063bFED7f213d5);
    CeloStakingElection private constant ELECTION = CeloStakingElection(0xbD7d392BB2eF07063256E875f363d4fb2931780e);
    swapcCopCelo private constant SWAP = swapcCopCelo(0xBE729350F8CdFC19DB6866e8579841188eE57f67);
    cCopToken private constant CCOP = cCopToken(0x434563B0604BE100F04B7Ae485BcafE3c9D8850E);

    function lock(uint256 relockAmount) external payable {
        if (relockAmount > 0) {
            try LOCKED_GOLD.relock(relockAmount, 0) {
                return;
            } catch {
                if (msg.value > 0) {
                    try LOCKED_GOLD.lock{value: msg.value}() {
                        return;
                    } catch {
                        revert("lock failed");
                    }
                } else {
                    revert("lock failed");
                }
            }
        } else {
            if (msg.value > 0) {
                try LOCKED_GOLD.lock{value: msg.value}() {
                    return;
                } catch {
                    revert("lock failed");
                }
            } else {
                revert("lock failed");
            }
        }
    }

    function unlock(uint256 amount) external {
        LOCKED_GOLD.unlock(amount);
    }

    function stake(address group, uint256 value, address lesser, address greater) external {
        bool ok = ELECTION.vote(group, value, lesser, greater);
        require(ok, "vote failed");
    }

    function unstake(address group, uint256 value, address lesser, address greater) external {
        try ELECTION.revokePending(group, value, lesser, greater, 0) returns (bool ok1) {
            require(ok1, "revokePending failed");
        } catch {
            try ELECTION.revokeActive(group, value, lesser, greater, 0) returns (bool ok2) {
                require(ok2, "revokeActive failed");
            } catch {
                revert("unstake failed");
            }
        }
    }

    function swap(uint256 amountIn, uint256 amountOutMin, swapcCopCelo.Step[] calldata path) external returns (uint256[] memory amounts) {
        bool ok = CCOP.increaseAllowance(address(SWAP), amountIn);
        require(ok, "increaseAllowance failed");
        return SWAP.swapExactTokensForTokens(amountIn, amountOutMin, path);
    }
}