// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IDAppStaking.sol";


contract Staking {
    error NativeTransferFailed();
    // Dirección del precompile DApps Staking V3 (Astar/Shibuya)
    address constant DAPPS_STAKING_V3 = 0x0000000000000000000000000000000000005001;

    
    event Locked(address indexed user, uint128 amount);
    event Staked(address indexed user, address indexed appAdress, uint128 amount);
    
    constructor() payable{}


    function _sendTokens(address to, uint256 amount) external {
        // Enviar ASTR nativa
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert NativeTransferFailed();
    }

    

    function lock(uint128 amount) external{
        // 1) Lock en precompile (NO requiere msg.value; la función es no payable según el interfaz)
        {
            try DAppStaking(DAPPS_STAKING_V3).lock(amount) returns (bool ok) {
                require(ok, "lock failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("lock error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }

        emit Locked(msg.sender, amount);
    }

    function stake(address appAdress, uint128 amount) external{

        // 2) stake hacia el dapp target (tipo EVM)
        {
            DAppStaking.SmartContract memory target = DAppStaking.SmartContract({
                contract_type: DAppStaking.SmartContractType.EVM,
                contract_address: abi.encodePacked(appAdress)
            });
            try DAppStaking(DAPPS_STAKING_V3).stake(target, amount) returns (bool ok) {
                require(ok, "stake failed");
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("stake error: ", reason)));
            } catch (bytes memory data) {
                revert(_getRevertMsg(data));
            }
        }

        emit Staked(msg.sender, appAdress, amount);
    }


    function _getRevertMsg(bytes memory returnData) internal pure returns (string memory) {
        if (returnData.length < 68) return "call failed";
        assembly {
            returnData := add(returnData, 0x04)
        }
        return abi.decode(returnData, (string));
    }

    // -------- Consultas al estado del protocolo DApp Staking --------
    /// @notice Obtiene el estado actual del protocolo (era, periodo, subperiodo) desde el precompile.
    /// @return era Número de era en curso
    /// @return period Número de periodo en curso
    /// @return subperiod Tipo de subperiodo actual (Voting, BuildAndEarn)
    function getProtocolState()
        external
        view
        returns (
            uint256 era,
            uint256 period,
            DAppStaking.Subperiod subperiod
        )
    {
        DAppStaking.ProtocolState memory ps = DAppStaking(DAPPS_STAKING_V3).protocol_state();
        return (ps.era, ps.period, ps.subperiod);
    }

}