const Token = artifacts.require('./Token')
require('chai')
.use(require('chai-as-promised'))
.should()

contract('Token', (accounts) => {
  let token;
  const name = "Decentralized Atlanta Stock Exchange"
  const symbol = "DASE"
  const decimals = '18'
  const totalSupply = "720000000000000000000000"

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
      token_totalSupply.toString().should.equal(totalSupply)
    })
  })
})
