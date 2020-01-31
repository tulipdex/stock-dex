//Handles the behavior for our decentalized stock exchange

/* TODO
    [X] Set the Fee account
    [X] Deposit Funds
    [X] Withdraw Funds
    [X] Deposit Tokens
    [X] Withdraw Tokens
    [X] Check Balances
    [X] Make Orders
    [X] Cancel Order
    [X] Fill Order
    [X] Charge Fees
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
  mapping(uint256 => _Order) public orders; // allows us to read all the orders fromt he mapping
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;
  uint256 public orderCount;


  //Events
  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp);

    event CancelOrders(
      uint256 id,
      address user,
      address tokenGet,
      uint256 amountGet,
      address tokenGive,
      uint256 amountGive,
      uint256 timestamp);

      event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp);

  /* Defining our own types */
  //Model the order + used only within smart contract
  struct _Order{
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }
  //Store the order
  //Add order to storage
  //Retrive the order

  constructor(address _fee_account, uint256 _fee_percent) public{
    fee_account = _fee_account;
    fee_percent = _fee_percent;
  }
  function() external{
    revert();
  }
  function depositEther() payable public{
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }
  function withdrawEther(uint256 _amount) public{
    require(tokens[ETHER][msg.sender] >= _amount);
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    msg.sender.transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }
  function depositToken(address _token, uint256 _amount) public {
    /* dont allow ether deposit */
    require(_token != ETHER);
    /* sent tokens to this contract */
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    // Manage Deposit - update balance
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    // emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
  function withdrawToken(address _token, uint256 _amount) public{
    require(_token != ETHER);
    require(tokens[_token][msg.sender] >= _amount);
    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    require(Token(_token).transfer(msg.sender, _amount));
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
  function balanceOf(address _token, address _user) public view returns(uint256){
    return tokens[_token][_user];
  }
  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public{
    orderCount = orderCount.add(1);
    //create counter cache
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
  }
  function cancelOrder(uint _id) public{
    _Order storage _order = orders[_id];
    //makesure the orderuser is the same person calling the function
    //must be a valid order
    require(address(_order.user) == msg.sender);
    require(_order.id == _id);
    orderCancelled[_id] = true;
    emit CancelOrders(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount);
    require(!orderFilled[_id]);
    require(!orderCancelled[_id]);
    //fetch order
    _Order storage _order = orders[_id];
    executeTrade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    orderFilled[_order.id] = true;
  }

  function executeTrade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint _amountGive) internal {
    //Fee will be paid by the user who fills the order
      //Charge fee
    uint256 fee_amount = _amountGet.mul(fee_percent).div(100);

    //Execute the trade - basic approach
    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(fee_amount));
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
    tokens[_tokenGet][fee_account] = tokens[_tokenGet][fee_account].add(fee_amount);
    tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive); //created the order
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive); //filling the order
    //Mark the order as filled
        //emit a trade event
    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
  }
}
