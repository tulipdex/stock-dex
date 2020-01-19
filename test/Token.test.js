const Token = artifacts.require('./Token')
require('chai')
.use(require('chai-as-promised'))
.should()

const tokens = require('./helpers')
const EVM_REVERT = 'VM Exception while processing transaction: revert'

//accounts injects all of the accounts
contract('Token', ([deployer, receiver, exchange]) => {
  let token;
  const name = "Decentralized Atlanta Stock Exchange"
  const symbol = "DASE"
  const decimals = '18'
  const totalSupply = tokens(720000).toString()

  beforeEach(async () =>{
    // Fetches token from the blcokchain
    // before each test that takes place
    token = await Token.new()
  })
  describe('deployment', () => {
    it('tracks the name', async ()=>{
      // Read the token name here
      const token_name = await token.name()
      // The token name is DASE
      token_name.should.equal(name)
    })
    it('tracks the symbol', async()=>{
      const token_sym = await token.symbol()
      token_sym.should.equal(symbol)
    })
    it('tracks the decimals', async()=>{
      const token_decimals = await token.decimals()
      token_decimals.toString().should.equal(decimals)
    })
    it('tracks the total supply', async()=>{
      const token_totalSupply = await token.totalSupply()
      token_totalSupply.toString().should.equal(totalSupply.toString())
    })

    it('assigns the total supply to the deployer', async()=>{
      const token_account_0 = await token.balanceOf(deployer)
      token_account_0.toString().should.equal(totalSupply.toString())
    })
  })

  describe('sending tokens', () => {
    let amount
    let transfer_result
    describe('success', async () => {
      beforeEach(async () =>{
        amount = tokens(501)
        transfer_result = await token.transfer(receiver, amount, {from: deployer})
      })
      it('transfers token balances', async() =>{
        let balanceOf
        //transfer
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(719499).toString())
        console.log('deployer\'s balance after transaction: ',  (balanceOf/1e18).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(amount.toString())
        console.log('receiever balance after transaction: ',  (balanceOf/1e18).toString())
      })

      it('emits a transfer event', async()=>{
        //Result contains information that contains the event
        const logs = transfer_result.logs[0]
        logs.event.should.eq('Transfer')
        const event = logs.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, ' to is correct')
        event.value.toString().should.equal(amount.toString(), ' value is correct')
      })
    })
    describe('failure', async () => {
      // This will expect for a failure examples
      it('rejects insufficent funds', async() =>{
        let invalidAmount
        invalidAmount = tokens(1000000)
        // insufficent funds
        await token.transfer(receiver, invalidAmount , {from: deployer}).should.be.rejectedWith(EVM_REVERT);

        invalidAmount = tokens(10)
        await token.transfer(deployer, invalidAmount , {from: receiver}).should.be.rejectedWith(EVM_REVERT);
      })

      it('rejects invalid recipients', async() =>{
        await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
      })
    })
  })

  describe('token approval', () =>{
    let approval_result
    let amount

    beforeEach(async ()=>{
      amount = tokens(1000)
      approval_result = await token.approve(exchange, amount, {from: deployer})
    })

    describe('success', ()=>{
      it('allocates an allowance for delegated token spending', async()=>{
        const allowance  = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(amount.toString())
      })
      it('emits an approval event', async()=>{
        //Result contains information that contains the event
        const logs = approval_result.logs[0]
        logs.event.should.eq('Approval')
        const event = logs.args
        event.owner.toString().should.equal(deployer, 'owner is correct')
        event.spender.should.equal(exchange, ' spender is correct')
        event.value.toString().should.equal(amount.toString(), ' value is correct')
      })

    })
    describe('failure', ()=>{
      it('rejects invalid recipients', async() =>{
        await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
      })
    })
  })

  describe('describe delegated token transfer', () => {
    let amount
    let transfer_result

    beforeEach(async () =>{
      amount = tokens(501)
      await token.approve(exchange, amount, {from: deployer})
    })
    describe('success', async () => {
      beforeEach(async () =>{
        transfer_result = await token.transferFrom(deployer, receiver, amount, {from: exchange})
      })
      it('transfers token balances', async() =>{
        let balanceOf;
        //transfer
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(719499).toString())
        console.log('deployer\'s balance after transaction: ',  (balanceOf/1e18).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(amount.toString())
        console.log('receiever balance after transaction: ',  (balanceOf/1e18).toString())
      })

      it('resets the allowance', async()=>{
        const allowance  = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })

      it('emits a transfer event', async()=>{
        //Result contains information that contains the event
        const logs = transfer_result.logs[0]
        logs.event.should.eq('Transfer')
        const event = logs.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, ' to is correct')
        event.value.toString().should.equal(amount.toString(), ' value is correct')
      })
    })
    describe('failure', async () => {
      // Don't allow for transfer tokens above their budget
      it('rejects insufficent funds', async() =>{
        let invalidAmount
        invalidAmount = tokens(1000000)
        // insufficent funds
        await token.transferFrom(deployer, receiver, invalidAmount , {from: exchange}).should.be.rejectedWith(EVM_REVERT)
      })
      // Don't allow for transfer tokens above their budget
      it('rejects invalid recipients', async() =>{
        await token.transfer(0x0, amount, {from: deployer}).should.be.rejected
      })
  })
})
})
