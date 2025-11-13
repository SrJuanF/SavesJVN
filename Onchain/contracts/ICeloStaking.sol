// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//********0x907f5C53C0E31dB06aF45BC58F076563469c525a********
interface CeloStakingAccount {
    function createAccount() external returns (bool);
}

//*********0x55E1A0C8f376964bd339167476063bFED7f213d5**********
interface CeloStakingGold{
    // Si hay parte en unlocking
    function relock(uint256, uint256) external;
    //Si revierte, despues se intenta con lock, locks nuevos
    function lock() external payable;
    
    function unlock(uint256) external;
}

//*********0xbD7d392BB2eF07063256E875f363d4fb2931780e***********
interface CeloStakingElection{
    /*
    0	group	address
0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9
1	value	uint256 => digita usuario
2	lesser	address
0xb35Be22BccB0dB9dC62967dcF15fEB97C20f854e
3	greater	address
0x2fd49E97262D505Fd76BB6E0e06eC10e1fd54589
     */
    //"Staking"
    function vote(
        address group,
        uint256 value,
        address lesser,
        address greater
    ) external returns (bool);

    //Primero revokePending, si acabo de stakear
    function revokePending(
        address group,
        uint256 value,
        address lesser,
        address greater,
        uint256 index
    ) external returns (bool);
    //Si revierte, despues se intenta con revokeActive, si ya lleva tiempo en Staking
    function revokeActive(
        address group,
        uint256 value,
        address lesser,
        address greater,
        uint256 index
    ) external returns (bool);
}

//0xBE729350F8CdFC19DB6866e8579841188eE57f67
interface swapcCopCelo{

    /*
1	amountIn	uint256 => digita usuario
2	amountOutMin	uint256 => digita usaurio
2	path.exchangeProvider	address
0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901
2	path.exchangeId	bytes32
0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b
2	path.assetIn	address
0x8A567e2aE79CA692Bd748aB832081C45de4041eA
2	path.assetOut	address
0x765DE816845861e75A25fCA122bb6898B8B1282a
3	path.exchangeProvider	address
0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901
3	path.exchangeId	bytes32
0x3135b662c38265d0655177091f1b647b4fef511103d06c016efdf18b46930d2c
3	path.assetIn	address
0x765DE816845861e75A25fCA122bb6898B8B1282a
3	path.assetOut	address
0x471EcE3750Da237f93B8E339c536989b8978a438
 */

    /// @notice Structure defining a single step in the swap path
    /// @param exchangeProvider The address of the exchange provider
    /// @param exchangeId The unique identifier for the exchange
    /// @param assetIn The address of the input asset
    /// @param assetOut The address of the output asset
    struct Step {
        address exchangeProvider;
        bytes32 exchangeId;
        address assetIn;
        address assetOut;
    }

    /// @notice Swap an exact amount of input tokens for as many output tokens as possible
    /// @param amountIn The amount of input tokens to swap
    /// @param amountOutMin The minimum amount of output tokens that must be received
    /// @param path An array of Step structs defining the swap path
    /// @return amounts The amounts of tokens for each step in the path
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Step[] calldata path
    ) external returns (uint256[] memory amounts);
}

//0x434563B0604BE100F04B7Ae485BcafE3c9D8850E
interface cCopToken{
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
}