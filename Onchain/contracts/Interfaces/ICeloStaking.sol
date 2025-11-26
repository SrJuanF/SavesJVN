// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//********0x907f5C53C0E31dB06aF45BC58F076563469c525a********
//Sepolia: 0x44957232699ca060B607E77083bDACD350d6b6d1
interface CeloStakingAccount {
    function createAccount() external returns (bool);

    function isAccount(address user) external view returns (bool);
}
//**************0xaEb865bCa93DdC8F47b8e29F40C5399cE34d0C58***************** */
//Sepolia: 0x5E7b295bd8D80625e2cCac97C98123aaEB5E7Ea5
interface IValidators{
    function getRegisteredValidators() external view returns (address[] memory);
    function getValidator(address account) external view returns (bytes memory, bytes memory, address, uint256, address);
}

//Proxy: ******0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E******
//Sepolia: 0x3DB0F0850c5b5f42fe30d68778C8958fC5EE7951
interface CeloStakingGold {
    // Debe haber indexes en pendingWithdrawl y pasar index por index hasta cumplir con el value
    function relock(uint256 index, uint256 value) external;

    //locks nuevos desde el balance activo
    function lock() external payable;

    // Deben estar en unstaked(locked)
    function unlock(uint256 value) external;

    // Despues de desbloquear se debe esperar cierto tiempo y pasar index por index
    function withdraw(uint256 index) external;

    //****************************** GETTERS ****************************************
    function getTotalLockedGold() external view returns (uint256);
    
    // Solo los celo que estan en locked(nonvoting)
    function getAccountNonvotingLockedGold(
        address account
    ) external view returns (uint256);

    // Incluye los que estan en staked(voting) y locked(nonvoting)
    function getAccountTotalLockedGold(
        address account
    ) external view returns (uint256);

    function getPendingWithdrawals(
        address account
    )
        external
        view
        returns (uint256[] memory values, uint256[] memory timestamps);

    function getPendingWithdrawal(
        address account,
        uint256 index
    ) external view returns (uint256, uint256);

    // // Returns the total amount to withdraw from unlocked CELO for an account. Sum indixes values
    function getTotalPendingWithdrawals(
        address account
    ) external view returns (uint256);

    //The duration in seconds users must wait before withdrawing CELO after unlocking.
    function unlockingPeriod() external view returns (uint256);
}

////Proxy: ******0x8D6677192144292870907E3Fa8A5527fE55A7ff6******
//Sepolia: 0xeB8B626f3A76174f4576bb47429c47EfDED7C211
interface CeloStakingElection {
/*  0	group	address 0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9
    1	value	uint256 => digita usuario
    2	lesser	address 0xb35Be22BccB0dB9dC62967dcF15fEB97C20f854e
    3	greater	address 0x2fd49E97262D505Fd76BB6E0e06eC10e1fd54589
    4   index	uint256 => es el index del address[] en mapping(address(account) => address[](groups)) groupsVotedFor - account
*/
    //************************FUNCTIONS****************************
    //pone en activos los que estan en pendingVotes
    function activate(address group) external returns (bool); //msg.sender is account
    function activateForAccount(address group, address account) external returns (bool);
    //Si estaba en Staking. State: Active
    function revokeActive(address group,uint256 value,address lesser,address greater,uint256 index) external returns (bool);
    function revokeAllActive(address group,address lesser,address greater,uint256 index) external returns (bool);
    //Si acabo de stakear. State: Pending
    function revokePending(address group,uint256 value,address lesser,address greater,uint256 index) external returns (bool);
    //Staking
    function vote(address group,uint256 value,address lesser,address greater) external returns (bool);

    //**************************GETTERS******************************* */
    function getTotalVotesForEligibleValidatorGroups() external view returns (address[] memory groups, uint256[] memory values);
    function getEpochNumber() external view returns (uint256);
    function getEpochNumberOfBlock(uint256 blockNumber) external view returns (uint256);
    //Account
    function getTotalVotesByAccount(address account) external view returns (uint256);
    function getGroupsVotedForByAccount(address account) external view returns (address[] memory);

    function getTotalVotesForGroupByAccount(address group,address account) external view returns (uint256);
    function getActiveVotesForGroupByAccount(address group,address account) external view returns (uint256);
    function getPendingVotesForGroupByAccount(address group,address account) external view returns (uint256);
    function hasActivatablePendingVotes(address account, address group) external view returns (bool);
    //Group
    function getTotalVotesForGroup(address group) external view returns (uint256);
    function getActiveVotesForGroup(address group) external view returns (uint256);
    function getPendingVotesForGroup(address group) external view returns (uint256);
    function getGroupEligibility(address group) external view returns (bool);
    function getGroupEpochRewardsBasedOnScore(address group,uint256 totalEpochRewards,uint256 groupScore) external view returns (uint256);


    /*
    **************************GETTERS****************************
    //Guarda en cache para busquedas rapidas
    function updateTotalVotesByAccountForGroup(address account, address group) public;
    [ cachedVotesByAccount(address) method Response ]
    totalVotes   uint256 :  0

    //VoteUnits son puntos de score, no son votes(celo)
    [ getActiveVoteUnitsForGroup(address) method Response ]
    uint256 :  109628140065863216849090495748447624598013439
    [ getActiveVoteUnitsForGroupByAccount(address,address) method Response ]
    uint256 :  4990851636878212864072791271667130304098
    */
}

//Unique: 0xBE729350F8CdFC19DB6866e8579841188eE57f67
interface swapcCopCelo {
    /*
    1	amountIn	uint256 => digita usuario
    2	amountOutMin	uint256 => digita usaurio

    2	path.exchangeProvider	address 0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901 - MentoLabs - BI Pool Manager
    2	path.exchangeId	bytes32 0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b
    2	path.assetIn	address 0x8A567e2aE79CA692Bd748aB832081C45de4041eA - cCop Token
    2	path.assetOut	address 0x765DE816845861e75A25fCA122bb6898B8B1282a  - USDC

    3	path.exchangeProvider	address 0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901 - MentoLabs - BI Pool Manager
    3	path.exchangeId	bytes32 0x3135b662c38265d0655177091f1b647b4fef511103d06c016efdf18b46930d2c
    3	path.assetIn	address 0x765DE816845861e75A25fCA122bb6898B8B1282a - USDC
    3	path.assetOut	address 0x471EcE3750Da237f93B8E339c536989b8978a438 - Celo Token

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

    /// @notice Swap as few input tokens as possible for an exact amount of output tokens
    /// @param amountOut The exact amount of output tokens needed
    /// @param amountInMax The maximum amount of input tokens that can be spent
    /// @param path An array of Step structs defining the swap path
    /// @return amounts The amounts of tokens for each step in the path
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        Step[] calldata path
    ) external returns (uint[] memory amounts);

    /// @notice Get the output amount for a given input amount and path
    /// @param amountIn The amount of input tokens to swap
    /// @param path An array of Step structs defining the swap path
    /// @return amountOut The calculated amount of output tokens
    function getAmountOut(
        uint256 amountIn,
        Step[] calldata path
    ) external view returns (uint256 amountOut);

    /// @notice Get the input amount for a given output amount and path
    /// @param amountOut The exact amount of output tokens needed
    /// @param path An array of Step structs defining the swap path
    /// @return amountIn The calculated amount of input tokens
    function getAmountIn(
        uint256 amountOut,
        Step[] calldata path
    ) external view returns (uint256 amountIn);
}
