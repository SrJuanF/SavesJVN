const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
  console.log("Verifying contract...")
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    })
    return true
  } catch (e) {
    if (typeof e?.message === "string" && e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!")
      return true
    }
    console.log(e)
    return false
  }
}

module.exports = { verify }
