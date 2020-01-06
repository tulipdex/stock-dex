pragma solidity ^0.5.0;

//Declaring smart contracts

contract Token{
  /* All the code for the smart contract  will live here */
  /* public allows for data to be visible outside of the smart contract */
  string public name = "Decentralized Atlanta Stock Exchange";
  string public symbol  = "DASE";
  uint256 public decimals  = 18;
  uint256 public totalSupply;

  constructor() public {
    /* This isn't the true total supply.
    You must multiply it by the decimal */
    totalSupply = 720000 * (10 ** decimals);
  }

}
