const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')
require('chai')
.use(require('chai-as-promised'))
.should()

const tokens = require('./helpers')
const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000"
const EVM_REVERT = 'VM Exception while processing transaction: revert'

contract('Exchange', ([deployer, fee_account, userOne, userTwo])=>{
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

  describe('withdrawing ether', async () => {
    let result
    let amount
    beforeEach(async () =>{
      //Deposits the Ether first
      amount = tokens(2)
      await exchange.depositEther({from: userOne, value: amount})
    })
    describe('success', async()=>{
      beforeEach(async () =>{
        //Withdraws the Ether
        result = await exchange.withdrawEther(amount, {from: userOne})
      })
      it('withdraws the ether\'s funds', async() =>{
        // Check the token balance
        const balance = await exchange.tokens(ETHER_ADDRESS, userOne)
        balance.toString().should.equal('0')
      })
      it('emits withdraw event', async() =>{
        const logs = result.logs[0]
        logs.event.should.eq('Withdraw')
        const event = logs.args
        event.token.should.equal(ETHER_ADDRESS)
        event.user.should.equal(userOne)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal('0')
      })
    })
    describe('failure', async()=>{
      it('rejects withdraws for insufficient balances', async()=>{
        await exchange.withdrawEther(tokens(20), {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('withdrawing tokens', async () => {
    let result
    let amount
    describe('success', async()=>{
      beforeEach(async () =>{
        //Withdraws the Ether
        amount = tokens(2)
        await token.approve(exchange.address, amount, {from: userOne})
        await exchange.depositToken(token.address, amount, {from: userOne})
        result = await exchange.withdrawToken(token.address, amount, {from: userOne})
      })
      it('withdraws the token funds', async() =>{
        // Check the token balance
        const balance = await exchange.tokens(token.address, userOne)
        balance.toString().should.equal('0')
      })
      it('emits withdraw event', async() =>{
        const logs = result.logs[0]
        logs.event.should.eq('Withdraw')
        const event = logs.args
        event.token.should.equal(token.address)
        event.user.should.equal(userOne)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal('0')
      })
    })
    describe('failure', async()=>{
      it('rejects Ether Withdraws', async()=>{
        await exchange.withdrawToken(ETHER_ADDRESS, tokens(20), {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects withdraws for insufficient balances', async()=>{
        await exchange.withdrawToken(token.address, tokens(20), {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
    })

    describe('checking balances', async()=>{
      beforeEach(async()=>{
        exchange.depositEther({from: userOne, value: amount})
      })
      it('returns user balance', async()=>{
        const result = await exchange.balanceOf(ETHER_ADDRESS, userOne)
        result.toString().should.equal(amount.toString())
      })
    })
  })

  describe('making order', async()=>{
    let result

    beforeEach(async() =>{
      result = await exchange.makeOrder(token.address, tokens(2), ETHER_ADDRESS, tokens(2), {from: userOne})
    })
    it('tracks the newly created order', async() =>{
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1', 'id is correct')
      order.user.should.equal(userOne, 'user is correct')
      order.tokenGet.should.equal(token.address, 'tokenGet is correct')
      order.amountGet.toString().should.equal(tokens(2).toString(), 'amountGet is correct')
      order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      order.amountGive.toString().should.equal(tokens(2).toString(), 'amountGive is correct')
      order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })
    it('emits an Order event', async() =>{
      // Check the token balance
      const logs = result.logs[0]
      logs.event.should.eq('Order')
      const event = logs.args
      event.id.toString().should.equal('1', 'id is correct')
      event.user.should.equal(userOne, 'user is correct')
      event.tokenGet.should.equal(token.address, 'tokenGet is correct')
      event.amountGet.toString().should.equal(tokens(2).toString(), 'amountGet is correct')
      event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      event.amountGive.toString().should.equal(tokens(2).toString(), 'amountGive is correct')
      event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })
  })

  describe('order actions', async()=>{

    beforeEach(async ()=>{
      //userOne deposits the ether
      await exchange.depositEther({from: userOne, value: tokens(1)})
      //gives the tokens to userTwo
      await token.transfer(userTwo, tokens(100), {from: deployer})
      //userTwo depsosits tokens only
      await token.approve(exchange.address, tokens(2), {from: userTwo})
      await exchange.depositToken(token.address, tokens(2), {from: userTwo})
      //userOne makes an order to buy tokens with Ether
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, tokens(1), {from: userOne})
    })

  describe('filling orders', async()=>{
    let result

    describe('success', async()=>{
      beforeEach(async()=>{
        //userOne fills order
        result = await exchange.fillOrder('1', {from: userTwo})
      })

      it('executes the trade & charge fees', async ()=>{
        let balance

        balance = await exchange.balanceOf(token.address, userOne)
        balance.toString().should.equal(tokens(1).toString(), 'userOne received tokens')
        balance = await exchange.balanceOf(ETHER_ADDRESS, userTwo)
        balance.toString().should.equal(tokens(1).toString(), 'userTwo recieved Ether')
        balance = await exchange.balanceOf(ETHER_ADDRESS, userOne)
        balance.toString().should.equal('0', 'userOne Ether deducted')
        balance = await exchange.balanceOf(token.address, userTwo)
        balance.toString().should.equal(tokens(0.98).toString(), 'userTwo tokens dedcuted with fee applied')
        const fee_account = await exchange.fee_account()
        balance = await exchange.balanceOf(token.address, fee_account)
        balance.toString().should.equal(tokens(.02).toString(), 'fee_account received fee')
      })
      it('updates filled orders', async ()=>{
        const orderFilled = await exchange.orderFilled(1)
        orderFilled.should.equal(true)
      })
      it('emits an trade event', async() =>{
        // Check the token balance
        const logs = result.logs[0]
        logs.event.should.eq('Trade')
        const event = logs.args
        event.id.toString().should.equal('1', 'id is correct')
        event.user.should.equal(userOne, 'user is correct')
        event.tokenGet.should.equal(token.address, 'tokenGet is correct')
        event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
        event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
        event.amountGive.toString().should.equal(tokens(1).toString(), 'amountGive is correct')
        event.userFill.should.equal(userTwo, 'userFill is correct')
        event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
      })
    })
    describe('failure', async()=>{
      //CODE...
      it('rejects invalid order ids', async()=>{
        const invalidOrderId = 220000
        await exchange.cancelOrder(invalidOrderId, {from: userTwo}).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects already-filled orders cancelations', async()=>{
        await exchange.fillOrder('1', {from: userTwo}).should.be.fulfilled
        await exchange.fillOrder('1', {from: userTwo}).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects cancelled orders', async()=>{
        await exchange.cancelOrder('1', {from: userOne}).should.be.fulfilled
        await exchange.fillOrder('1', {from: userTwo}).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })


  describe('cancelling orders', async()=>{
    let result

    describe('success', async()=>{
      beforeEach(async()=>{
        result = await exchange.cancelOrder('1', {from: userOne})
      })

      it('updates cancelled orders', async ()=>{
        const orderCancelled = await exchange.orderCancelled(1)
        orderCancelled.should.equal(true)
      })
      it('emits an CancelOrders event', async() =>{
        // Check the token balance
        const logs = result.logs[0]
        logs.event.should.eq('CancelOrders')
        const event = logs.args
        event.id.toString().should.equal('1', 'id is correct')
        event.user.should.equal(userOne, 'user is correct')
        event.tokenGet.should.equal(token.address, 'tokenGet is correct')
        event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
        event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
        event.amountGive.toString().should.equal(tokens(1).toString(), 'amountGive is correct')
        event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
      })
    })
    describe('failure', async()=>{
      //CODE...
      it('rejects invalid order ids', async()=>{
        const invalidOrderId = 220000
        await exchange.cancelOrder(invalidOrderId, {from: userOne}).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects unauthorized cancelations', async()=>{
      await exchange.cancelOrder('1', {from: userTwo}).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })
  })
})
