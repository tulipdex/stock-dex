//Makes a demo data for smart contract
const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000"
const EVM_REVERT = 'VM Exception while processing transaction: revert'
const ether = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}
const tokens = (n) => ether(n)

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = async function(callback){
  try{
    const accounts = await web3.eth.getAccounts()
    const token = await Token.deployed()
    console.log('Token fetch', token.address)

    const exchange = await Exchange.deployed()
    console.log('Exchange fetch', exchange.address)
    console.log("script running...")

    const sender = accounts[0]
    const receiver = accounts[1]

    let amount = web3.utils.toWei('10000', 'ether')

    await token.transfer(receiver, amount, {from: sender})
    console.log(`transferred ${amount} tokens from ${sender} to ${receiver}`)

    const user1 = accounts[0]
    const user2 = accounts[1]

    amount = 1
    await exchange.depositEther({from: user1, value: ether(amount)})
    console.log(`Deposited ${amount} Ether from ${user1}`)

    amount = 10000
    await token.approve(exchange.address, tokens(amount), {from:user2})
    console.log(`Approved ${amount} tokens from ${user2}`)

    await exchange.depositToken(token.address, tokens(amount), {from: user2})
    console.log(`Deposited ${amount} tokens from ${user2}`)
    //////////////////////////////////////////////////////////
    //Seeding a cancelled order
    let result
    let orderId

    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from: user1})
    console.log(`made order from ${user1}`)

    //user cancels order
    orderId = result.logs[0].args.id
    await exchange.cancelOrder(orderId, {from: user1})
    console.log(`cancelled order from ${user1}`)
    //////////////////////////////////////////////////////////
    //Seeding a filled order

    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from: user1})
    console.log(`made order from ${user1}`)

    // user2 fills order
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, {from:user2})
    console.log(`Fill Order from ${user1}`)

    // avoids timestamp collisions
    await wait(1)

    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from: user1})
    console.log(`made order from ${user1}`)

    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, {from:user2})
    console.log(`Fill Order from ${user1}`)

    await wait(1)

    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from: user1})
    console.log(`made order from ${user1}`)

    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, {from:user2})
    console.log(`Fill Order from ${user1}`)

    await wait(1)

    // user one makes 10 orders
    for(let i = 1; i <= 10; i++){
      result = await exchange.makeOrder(token.address, tokens(10*i), ETHER_ADDRESS, ether(0.01), {from: user1})
      console.log(`made order from ${user1}`)
      await wait(1)
    }

    for(let i = 1; i <= 10; i++){
      result = await exchange.makeOrder(token.address, ether(10*i), ETHER_ADDRESS, tokens(0.01), {from: user2})
      console.log(`made order from ${user2}`)
      await wait(1)
    }

    //
    // //user cancels order
    // orderId = result.logs[0].args.id
    // await exchange.cancelOrder(orderId, {from: user1})
    // console.log(`cancelled order from ${user1}`)



  }
  catch(err){
    console.log(err)
  }
  callback()
}
