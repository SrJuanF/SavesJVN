const { ethers, deployments, network } = require("hardhat")

async function getBridges() {
  let address
  try {
    const d = await deployments.get("Bridges")
    address = d.address
  } catch (e) {
    address = process.env.BRIDGES_ADDRESS
  }
  if (!address) throw new Error("Bridges no desplegado y BRIDGES_ADDRESS no definido")
  return await ethers.getContractAt("Bridges", address)
}

async function waitReceipt(tx) {
  try {
    return await tx.wait()
  } catch (waitErr) {
    try {
      return await ethers.provider.waitForTransaction(tx.hash, 1, 60000)
    } catch (wftErr) {
      return await ethers.provider.getTransactionReceipt(tx.hash)
    }
  }
}

async function testSendMessage(bridges, signer) {
  const message = ethers.toUtf8Bytes("hello")
  const timeout = 600
  const to = signer.address
  const relayerFee = 0n
  const tx = await bridges.send_message(message, timeout, to, relayerFee)
  const receipt = await waitReceipt(tx)
  console.log("send_message", receipt?.transactionHash || tx.hash)
}

async function testSendResponse(bridges) {
  const request = {
    source: ethers.toUtf8Bytes("EVM-592"),
    dest: ethers.toUtf8Bytes("POLKADOT-2000"),
    nonce: 1n,
    from: ethers.toUtf8Bytes("MODULE-SRC"),
    to: ethers.toUtf8Bytes("MODULE-DEST"),
    timeoutTimestamp: BigInt(Math.floor(Date.now() / 1000) + 600),
    body: ethers.toUtf8Bytes("payload"),
  }
  const response = ethers.toUtf8Bytes("response")
  const timeout = 600
  const relayerFee = 0n
  const tx = await bridges.sendResponse(request, response, timeout, relayerFee)
  const receipt = await waitReceipt(tx)
  console.log("sendResponse", receipt?.transactionHash || tx.hash)
}

async function testReadState(bridges) {
  const dest = ethers.toUtf8Bytes("POLKADOT-2000")
  const keys = [ethers.toUtf8Bytes("key1")]
  const timeout = 600
  const fee = 0n
  const height = 0
  const context = ethers.toUtf8Bytes("ctx")
  const tx = await bridges.readState(dest, keys, timeout, fee, height, context)
  const receipt = await waitReceipt(tx)
  console.log("readState", receipt?.transactionHash || tx.hash)
}

async function main() {
  const bridges = await getBridges()
  const [signer] = await ethers.getSigners()
  console.log("network", network.name)
  try {
    await testSendMessage(bridges, signer)
  } catch (e) {
    console.error("send_message error", e?.message || e)
  }
  try {
    await testSendResponse(bridges)
  } catch (e) {
    console.error("sendResponse error", e?.message || e)
  }
  try {
    await testReadState(bridges)
  } catch (e) {
    console.error("readState error", e?.message || e)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})