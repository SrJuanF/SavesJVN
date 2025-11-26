const networkConfig = {
    default: {
        name: "hardhat",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    31337: {
        name: "localhost",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    42220: {
        name: "celoMainnet",
        IsmpHost: "",
        erc20: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
        // Celo staking
        celoAccount: "0x907f5C53C0E31dB06aF45BC58F076563469c525a",
        celoLockedGold: "0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E",
        celoElection: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6",
        celoValidators: "0xaEb865bCa93DdC8F47b8e29F40C5399cE34d0C58",
    },
    11142220: {
        name: "celoSepolia",
        IsmpHost: "",
        erc20: "0x5F8d55c3627d2dc0a2B4afa798f877242F382F67",
        // Celo staking
        celoAccount: "0x44957232699ca060B607E77083bDACD350d6b6d1",
        celoLockedGold: "0x3DB0F0850c5b5f42fe30d68778C8958fC5EE7951",
        celoElection: "0xeB8B626f3A76174f4576bb47429c47EfDED7C211",
        celoValidators: "0x5E7b295bd8D80625e2cCac97C98123aaEB5E7Ea5",
    },
    592: {
        name: "astarMainnet",
        IsmpHost: "",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    81: {
        name: "shibuyaTestnet",
        IsmpHost: "",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    8453: {
        name: "baseMainnet",
        IsmpHost: "0x6FFe92e4d7a9D589549644544780e6725E84b248",
        erc20: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    84532: {
        name: "baseSepolia",
        IsmpHost: "0xD198c01839dd4843918617AfD1e4DDf44Cc3BB4a",
        erc20: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    },
    42161: {
        name: "arbitrumOne",
        IsmpHost: "0xE05AFD4Eb2ce6d65c40e1048381BD0Ef8b4B299e",
        erc20: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
    421614: {
        name: "arbitrumSepolia",
        IsmpHost: "0x3435bD7e5895356535459D6087D1eB982DAd90e7",
        erc20: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 2
const frontEndContractsFile = "../Ahorro-JVN/hooks/contracts/contracts.json"
const frontEndAbiLocation = "../Ahorro-JVN/hooks/contracts"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiLocation,
}