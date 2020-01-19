//Handles the behavior for our decentalized stock exchange

/* TODO
    [X] Set the Fee account
    [X] Deposit Funds
    [] Withdraw Funds
    [] Deposit Tokens
    [] Withdraw Tokens
    [] Check Balances
    [] Make Orders
    [] Cancel Order
    [] Fill Order
    [] Charge Fees
*/

pragma solidity ^0.5.0;
/* import token smart contract */
import "./Token.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Exchange{
  using SafeMath for uint;

  address public fee_account; //This will be the account that receives exchange fees
  uint256 public fee_percent; // This is the fee percent
  address constant ETHER = address(0); //This allows us to store ether mapping with blank address

  mapping(address => mapping(address => uint256)) public tokens;

  //Events
  event Deposit(address token, address user, uint256 amount, uint256 balance);

  constructor(address _fee_account, uint256 _fee_percent) public{
    fee_account =_fee_account;
    fee_percent =_fee_percent;
  }
  function() external{
    revert();
  }
  function depositEther() payable public{
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }
  function depositToken(address _token, uint _amount) public {
    /* dont allow ether deposit */
    require(_token != ETHER);
    /* sent tokens to this contract */
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    // Manage Deposit - update balance
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    // emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
}
