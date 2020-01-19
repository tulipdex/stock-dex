const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')
require('chai')
.use(require('chai-as-promised'))
.should()

const tokens = require('./helpers')
const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000"
const EVM_REVERT = 'VM Exception while processing transaction: revert'

contract('Exchange', ([deployer, fee_account, userOne])=>{
  let exchange
  let token
  const feePercent = 2

  beforeEach(async() =>{
    //Setting a constructor variable for this file
    token = await Token.new()
    // transferring tokens to user one
    token.transfer(userOne, tokens(200), {from: deployer})
    exchange = await Exchange.new(fee_account, feePercent)
  })
  describe('deployment', () => {
    it('tracks the fee account', async()=>{
      const result = await exchange.fee_account()
      result.should.equal(fee_account)
    })
    it('tracks the fee percent', async()=>{
      const result = await exchange.fee_percent()
      result.toString().should.equal(feePercent.toString())
    })
  })
  describe('fallback', () => {
    it('reverts when Ether is sent', async()=>{
      await exchange.sendTransaction({value: 1, from: userOne}).should.be.rejectedWith(EVM_REVERT)
    })
  })
  describe('depositing tokens', () => {
    let result
    let amount
    describe('success', async()=>{
      beforeEach(async()=>{
        amount = tokens(50)
        // approve the tokens for transfer
        await token.approve(exchange.address, amount, {from: userOne})
        // deposits the tokenss
        result = await exchange.depositToken(token.address, amount, {from: userOne})
      })
      it('tracks the token deposit', async() =>{
        // Check the token balance
        let balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        // Checks the tokens on the exchange
        balance = await exchange.tokens(token.address, userOne)
        balance.toString().should.equal(amount.toString())
      })
      it('emits deposit event', async() =>{
        // Check the token balance
        const logs = result.logs[0]
        logs.event.should.eq('Deposit')
        const event = logs.args
        event.token.should.equal(token.address, 'token address is correct')
        event.user.should.equal(userOne, 'user address is correct')
        event.amount.toString().should.equal(amount.toString(), ' amount is correct')
        event.balance.toString().should.equal(amount.toString(), ' balance is correct')
      })
    })
    describe('failure', async()=>{
      it("it rejects ether deposits", async()=>{
        await exchange.depositToken(ETHER_ADDRESS, amount, {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails when there are no tokens approved', async() =>{
        // Check the token balance
        await exchange.depositToken(token.address, amount, {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('depositing ether', async () => {
    let result
    let amount
    beforeEach(async () =>{
      amount = tokens(1)
      result = await exchange.depositEther({from: userOne, value: amount})
    })
    describe('success', async()=>{
      it('tracks the ether deposit', async() =>{
        // Check the token balance
        let balance
        balance = await exchange.tokens(ETHER_ADDRESS, userOne)
        balance.toString().should.equal(amount.toString())
      })
      it('emits deposit event', async() =>{
        // Check the token balance
        const logs = result.logs[0]
        logs.event.should.eq('Deposit')
        const event = logs.args
        event.token.should.equal(ETHER_ADDRESS, 'token address is correct')
        event.user.should.equal(userOne, 'user address is correct')
        event.amount.toString().should.equal(amount.toString(), ' amount is correct')
        event.balance.toString().should.equal(amount.toString(), ' balance is correct')
      })
    })
  })

})
