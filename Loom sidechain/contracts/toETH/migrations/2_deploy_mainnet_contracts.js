const { writeFileSync } = require('fs')

const CryskToken = artifacts.require('CryskToken')
const Gateway = artifacts.require('Gateway')

module.exports = (deployer, _network, accounts) => {
  const [_, user] = accounts
  const validator = accounts[9]
  deployer.deploy(Gateway, [validator], 3, 4).then(async () => {
    const gatewayInstance = await Gateway.deployed()

    console.log(`Gateway deployed at address: ${gatewayInstance.address}`)

    const cryskTokenContract = await deployer.deploy(CryskToken, gatewayInstance.address)
    const cryskTokenInstance = await CryskToken.deployed()

    console.log(`CryskToken deployed at address: ${cryskTokenInstance.address}`)
    console.log(`CryskToken transaction at hash: ${cryskTokenContract.transactionHash}`)


    await gatewayInstance.toggleToken(cryskTokenInstance.address, { from: validator })
    await cryskTokenInstance.transfer(user, 100)

    writeFileSync('../../gateway_address', gatewayInstance.address)
    writeFileSync('../../crysk_token_address', cryskTokenInstance.address)
    writeFileSync('../../crysk_token_tx_hash', cryskTokenContract.transactionHash)
  })
}
