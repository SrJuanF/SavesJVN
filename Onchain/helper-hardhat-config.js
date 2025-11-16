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
    },
    11142220: {
        name: "celoSepolia",
        IsmpHost: "",
        erc20: "0x5F8d55c3627d2dc0a2B4afa798f877242F382F67",
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