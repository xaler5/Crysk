pragma solidity ^0.4.23;
//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./playersContract.sol";
import "./countriesContract.sol";
import "./bombCards.sol";

contract marketplaceContract is Ownable {

    using SafeMath for uint;

    uint public basePrice;
    address public logicAdr;
    uint public armyUnitPrice;
    uint public lifepointUnitPrice;
    uint public contractBalance;

    playersContract players;
    countriesContract countries;
    bombCards bombCard;

    //Colored logs event
    event buyEvent(address adr, string name, string team, address victim, string nick);

    // BE SURE TO PUT THE RIGHT OWNER BEFORE PRODUCTION
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier onlyLogic {
        require(msg.sender == logicAdr);
        _;
    }

    constructor(address adr) public {
        basePrice = 20000000000000000; //0.02eth
        logicAdr = 0x0;
        armyUnitPrice = 100000000000000;
        lifepointUnitPrice = 100000000000000;
        owner = adr;//msg.sender;//0xBB9CAE0071054774d47B3299EFb1E6e3ef1153d1;
        contractBalance = 0;
        players = playersContract(0x0);
        countries = countriesContract(0x0);
        bombCard = bombCards(0x0);
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

    function setBombCardContract(address adr) onlyOwner external returns (bool) {
        bombCard = bombCards(adr);
        return true;
    }

    function setLogicAddress(address adr) onlyOwner external returns (bool) {
        logicAdr = adr;
        return true;
    }


//--------------------- Getters -------------------------------------------------------//

    function getArmyPrice() external view returns (uint) {
        return armyUnitPrice;
    }

    function getLifePointPrice() external view returns (uint) {
        return lifepointUnitPrice;
    }

//-------------------Internal functions-------------------------------------------------//

    function updatePlayerInfos(address adr, string to, uint expts) internal {
        address oldOwner = countries.getOwner(to);
        players.updatePossessions(adr, oldOwner, true);
        players.addExpPts(adr, expts);
        countries.changeOwnership(to,adr,0,0);
    }

//--------------------State changing functions------------------------------------------//

    //MARKETPLACE
    function buyArmy(address adr, uint quantity,uint value) onlyLogic external payable {
        bool existence = players.getExistence(adr);
        if (existence == false) {
            players.newPlayer(adr); 
        }
        contractBalance = contractBalance.add(msg.value);
        players.buyArmy(adr,quantity,armyUnitPrice, value);
    }

    function buyLifePoints(address adr, string to, uint quantity) onlyLogic external payable {
        require(msg.value >= lifepointUnitPrice.mul(quantity));
        contractBalance = contractBalance.add(msg.value);
        countries.addLifePoints(to,adr,quantity);
    }

    function buyObject(address adr, string name) onlyLogic external payable {
        bool existence = players.getExistence(adr);
        if (existence == false) {
            players.newPlayer(adr); 
        }
        address victim = countries.getOwner(name);
        if ( countries.getExistence(name) == true ) {
            countries.buyObject(name, msg.value);
            contractBalance = contractBalance.add(msg.value.div(100).mul(10));
            countries.getOwner(name).transfer(msg.value.div(100).mul(90));
            updatePlayerInfos(adr,name,10);
        } else {
            require(msg.value >= basePrice.div(players.getLevel(adr)));
            contractBalance = contractBalance.add(msg.value);
            countries.newObject(adr,name);
            players.updatePossessions(adr,0x0,false);
            players.addExpPts(adr, 10);
        }
        players.checkLevelExp(adr);
        emit buyEvent(adr, name, players.getTeam(adr), victim, players.getNickname(adr));
    }

    function buyBombCard(address adr, uint index) onlyLogic external payable {
        bool existence = players.getExistence(adr);
        if (existence == false) {
            players.newPlayer(adr); 
        }
        bombCard.buyCard(index,adr,msg.value);
        contractBalance = contractBalance.add(msg.value);
    }

    //ONLY DEV
    function withdraw(uint value) external onlyOwner returns(bool) {
        require(contractBalance >= value);
        contractBalance = contractBalance.sub(value);
        msg.sender.transfer(value);
        return true;
    }
    
}