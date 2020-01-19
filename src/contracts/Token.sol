pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

//Declaring smart contracts

contract Token{
  /* Use the imported library */
  using SafeMath for uint;
  /* All the code for the smart contract  will live here */
  /* public allows for data to be visible outside of the smart contract */
  string public name = "Decentralized Atlanta Stock Exchange";
  string public symbol  = "DASE";
  uint256 public decimals  = 18;
  uint256 public totalSupply;

  //Track Balance
  mapping(address => uint256 ) public balanceOf;
  //Send Tokens - behavior/functionality

  //Keep track of the amount of tokens the exchange is allowed to spend
  mapping(address => mapping(address => uint256)) public allowance;

  //Events
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  constructor() public {
    /* This isn't the true total supply.
    You must multiply it by the decimal */
    totalSupply = 720000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns (bool success){
    /* test for sufficient funds */
    require(balanceOf[msg.sender] >= _value);
    _transfer(msg.sender, _to, _value);
    return true;
  }

  function _transfer(address _from, address _to, uint256 _value) internal{
    /* test for valid address */
    require(_to != address(0));
        //when sending tokens,  decrease the balance of sender address, increase the balance of the reciever by the _value
    balanceOf[_from] = balanceOf[_from].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(_from, _to, _value);
  }
  // Approve tokens
  // Allow people to transfer our tokens

  function approve(address _spender, uint256 _value) public returns (bool success){
    require(_spender != address(0));
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  //Transfer from
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
    require(_value <= balanceOf[_from]);
    require(_value <= allowance[_from][msg.sender]);
    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    _transfer(_from, _to, _value);
    return true;
  }
}
