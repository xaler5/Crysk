pragma solidity ^0.4.15;

//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./playersContract.sol";
import "./countriesContract.sol";
import "./actionsContract.sol";
import "./marketplaceContract.sol";
import "./attacksContract.sol";

contract logicContract is Ownable {

    using SafeMath for uint;

    address public interfaceAdr;
    uint public contractBalance;

    playersContract players;
    countriesContract countries;
    actionsContract action;
    marketplaceContract market;
    attacksContract attacks;

    // BE SURE TO PUT THE RIGHT OWNER BEFORE PRODUCTION
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier onlyInterface {
        require(msg.sender == interfaceAdr);
        _;
    }

    modifier notOwnedYet(address adr, string name) {
        require(countries.getOwner(name) != adr);
        _;
    }

    modifier legitAttack(address adr, string name) {
        require(countries.getOwner(name) != adr && players.getExistence(adr) == true);
        _;
    }

    constructor(address adr) public {
        interfaceAdr = 0x0;
        owner = adr;//msg.sender;//0xBB9CAE0071054774d47B3299EFb1E6e3ef1153d1;
        contractBalance = 0;
        players = playersContract(0x0);
        countries = countriesContract(0x0);
        action = actionsContract(0x0);
        market = marketplaceContract(0x0);
        attacks = attacksContract(0x0);
    }

//-------------------Init Functions ----------------------------------------------------//

    function setPlayersContract(address adr) onlyOwner external returns (bool) {
        players = playersContract(adr);
        return true;
    }

    function setCountriesContract(address adr) onlyOwner external returns (bool) {
        countries = countriesContract(adr);
        return true;
    }

    function setactionsContract(address adr) onlyOwner external returns (bool) {
        action = actionsContract(adr);
        return true;
    }

    function setattacksContract(address adr) onlyOwner external returns (bool) {
        attacks = attacksContract(adr);
        return true;
    }

    function setmarketPlaceContract(address adr) onlyOwner external returns (bool) {
        market = marketplaceContract(adr);
        return true;
    }

    function setInterfaceAddress(address adr) onlyOwner external returns (bool) {
        interfaceAdr = adr;
        return true;
    }

//--------------------State changing functions------------------------------------------//

    //MARKETPLACE
    function buyArmy(address adr, uint quantity) onlyInterface external payable {
        market.buyArmy.value(msg.value)(adr,quantity,msg.value);
    }

    function buyObject(address adr, string name) onlyInterface external notOwnedYet(adr, name) payable {
        market.buyObject.value(msg.value)(adr, name);
    }

    function buyLifePoints(address adr, string name, uint quantity) onlyInterface external payable {
        market.buyLifePoints.value(msg.value)(adr, name, quantity);
    }

    function buyBombCard(address adr, uint index) onlyInterface external payable {
        market.buyBombCard.value(msg.value)(adr,index);
    }

    //PLAYER ACTIONS
    //toggle==0 attackDMG, toggle==1 defense
    function upgradePower(address adr, bool toggle) onlyInterface external {
        action.upgradePower(adr, toggle);
    }

    function changeTeam(address adr, string name) onlyInterface external {
        action.changeTeam(adr,name);
    }

    function setNickName(address adr, string name) onlyInterface external {
        action.setNickName(adr,name);
    }

    //COUNTRY ACTIONS
    function addArmyInState(address adr, uint quantity, string name) onlyInterface external{
        require(countries.getOwner(name) == adr );
        action.addArmyInState(adr,quantity,name);
    }

    function subArmyFromState(address adr, uint quantity, string name) onlyInterface external {
        require(countries.getOwner(name) == adr);
        action.subArmyFromState(adr,quantity,name);
    }

    //ATTACKS
    function attack(address adr, string to, uint quantity) legitAttack(adr, to) onlyInterface external {
        attacks.attack(adr,quantity,to);
    }

    function applyBombCard(address adr, uint index, string name) legitAttack(adr, name) onlyInterface external returns(bool) {
        return attacks.applyBombCard(adr,index,name);
    }

    //ONLY DEV
    function withdraw(uint value) external onlyOwner returns(bool) {
        require(contractBalance >= value);
        contractBalance = contractBalance.sub(value);
        msg.sender.transfer(value);
        return true;
    }
    
}