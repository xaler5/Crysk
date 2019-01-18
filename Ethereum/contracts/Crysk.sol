pragma solidity ^0.4.23;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./logicContract.sol";
import "./bombCards.sol";

contract Crysk is Ownable {

    using SafeMath for uint;

    logicContract logic;
    bombCards bombCard;
    playersContract players;
    countriesContract countries;
    marketplaceContract market;

    constructor (address adr) public {
        owner = adr;
        logic = logicContract(0x0);
        players = playersContract(0x0);
        countries = countriesContract(0x0);
        market = marketplaceContract(0x0);
        bombCard = bombCards(0x0);
    }

    //Internal
    function setLogicContract(address adr) onlyOwner external returns(bool) {
        logic = logicContract(adr);
        return true;
    }

    function setmarketplaceContract(address adr) onlyOwner external returns(bool) {
        market = marketplaceContract(adr);
        return true;
    }

    function setPlayerContract(address adr) onlyOwner external returns(bool) {
        players = playersContract(adr);
        return true;
    }

    function setCountryContract(address adr) onlyOwner external returns(bool) {
        countries = countriesContract(adr);
        return true;
    }

    function setBombCardContract(address adr) onlyOwner external returns (bool) {
        bombCard = bombCards(adr);
        return true;
    }


//--------------------Getters functions-----------------------------------------------// 

    //CARDS
        //bombs
    function getUsercards() external view returns(uint[3]) {
        return bombCard.getUserCards(msg.sender);
    }

    function getCardPrice(uint index) external view returns(uint) {
        return bombCard.getPrice(index);
    }

    //PLAYER
    function getAvailableArmy(address adr) external view returns (uint) {
        return players.getArmy(adr);
    }

    function getPlayerLvl(address adr) external view returns (uint) {
        return players.getLevel(adr);
    }

    function getPlayerTeam(address adr) external view returns(string) {
        return players.getTeam(adr);
    }

    function getPlayerNickname(address adr) external view returns(string) {
        return players.getNickname(adr);
    }

    function getPlayerUpgrades(address adr) external view returns(uint) {
        return players.getUpgrades(adr);
    }

    function getTotalOwned(address adr) external view returns(uint) {
        return players.getTotalOwned(adr);
    }

    function getPlayerExpPts(address adr) external view returns (uint) {
        return players.getExpPts(adr);
    }

    //COUNTRY
    function itExists(string name) external view returns(bool) {
        return countries.getExistence(name);
    }   

    function getPrice(string name) external view returns (uint) {
        return countries.getPrice(name);
    }

    function getArmy(string name) external view returns (uint) {
        return countries.getArmy(name);
    }

    function getOwner(string name) public view returns (address) {
        return countries.getOwner(name);
    }

    function getLifePoints(string name) public view returns (uint) {
        return countries.getLifePoints(name);
    }

    function getTimer(string name) public view returns (uint) {
        return countries.getBlockLeft(name);
    }

    //LOGIC
    function getArmyUnitPrice() external view returns (uint) {
        return market.getArmyPrice();
    }

    function getLifePointUnitPrice() external view returns (uint) {
        return market.getLifePointPrice();
    }



//--------------------State changing functions------------------------------------------//

    //MARKETPLACE
    function buyArmy(uint quantity) external payable {
        logic.buyArmy.value(msg.value)(msg.sender, quantity);        
    }

    function buyLifePoints(string name, uint quantity) external payable {
        logic.buyLifePoints.value(msg.value)(msg.sender, name, quantity);
    }   
    
    function buyObject(string name) external payable {
        logic.buyObject.value(msg.value)(msg.sender, name); 
    }

    function buyBombCards(uint index) external payable {
        logic.buyBombCard.value(msg.value)(msg.sender, index);
    }

    //PLAYER ACTIONS
    function upgradeAttackDmg(address adr) external returns(uint) {
        logic.upgradePower(adr, false);
    }

    function upgradeDefense(address adr) external returns(uint) {
        logic.upgradePower(adr, true);
    }

    function addArmyInState(uint quantity, string name) external {
        logic.addArmyInState(msg.sender, quantity, name);
    }

    function subArmyFromState(uint quantity, string name) external {
        logic.subArmyFromState(msg.sender, quantity, name);
    }
    
    function changeTeam(string name) external returns(bool) {
        logic.changeTeam(msg.sender, name);
    }

    function changeNickname(string name) external returns(bool) {
        logic.setNickName(msg.sender, name);
    }

    function signUp(string team, string nick) external returns(bool) {
        logic.setNickName(msg.sender, nick);
        logic.changeTeam(msg.sender, team);
        return true;
    }

    //Attacks
    function attack(string to, uint quantity) external {
        logic.attack(msg.sender, to, quantity);
    }

    function applyBombCard(uint index, string name) external returns(bool) {
        return logic.applyBombCard(msg.sender, index, name);
    }

}