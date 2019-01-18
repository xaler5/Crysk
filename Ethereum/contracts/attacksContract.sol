pragma solidity ^0.4.23;
//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./playersContract.sol";
import "./countriesContract.sol";
import "./bombCards.sol";

contract attacksContract is Ownable {

    using SafeMath for uint;

    uint public baseDamage;
    address public logicAdr;

    playersContract players;
    countriesContract countries;
    bombCards bombCard;

    //Colored logs event
    event attackInflicted(address adr, uint num, string name, string team,address victim, string nick);
    event newOwner(address adr,string team,string country, address victim, string nick,uint subs);

    // BE SURE TO PUT THE RIGHT OWNER BEFORE PRODUCTION
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier onlyLogic {
        require(msg.sender == logicAdr);
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
        logicAdr = 0x0;
        owner = adr;//msg.sender;//0xBB9CAE0071054774d47B3299EFb1E6e3ef1153d1;
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

    function setLogicAddress(address adr) onlyOwner external returns (bool) {
        logicAdr = adr;
        return true;
    }

    function setBombCardContract(address adr) onlyOwner external returns (bool) {
        bombCard = bombCards(adr);
        return true;
    }

//-------------------Internal functions-------------------------------------------------//

    function updatePlayerInfos(address adr, string to, uint expts) internal {
        address oldOwner = countries.getOwner(to);
        players.updatePossessions(adr, oldOwner, true);
        players.addExpPts(adr, expts);
        countries.changeOwnership(to,adr,0,0);
    }

    function calculateAttackNumbers(address adr, string to, uint quantity, address attackedPlayer) internal view returns (bool) {
        uint dmg = players.getArmyDamage(adr);
        require(quantity <= players.getArmy(adr) );
        uint attackNum = quantity.mul(players.getLevel(adr).mul(dmg));
        uint dfns = players.getArmyDamage(attackedPlayer);
        uint defense = countries.getArmy(to).mul(players.getLevel(attackedPlayer).mul(dfns));
        if(attackNum > defense) return true;
        else return false;
    }

//--------------------State changing functions------------------------------------------//

    //ATTACKS
    function attack(address adr, uint quantity, string to) onlyLogic external {
        address attackedPlayer = countries.getOwner(to);
        string memory nick = players.getNickname(adr);
        string memory team = players.getTeam(adr);
        uint powerB = countries.getArmy(to).mul(players.getLevelDefense(attackedPlayer));
        uint powerA = quantity.mul(players.getLevelPower(adr));
        uint finalDamage = quantity.add(players.getLevel(adr)).mul(players.getArmyDamage(adr));
        if(powerA > powerB) {
            //old owner defeated its armies to 0 and IF conquered place subs in the state else substract quantity-remainings
            uint subs = (powerA.sub(powerB)).div(players.getLevelPower(adr));

            if(countries.attack(adr,team,finalDamage,to,subs,nick) != true) {
                players.changeArmy(adr,quantity.sub(subs),true);
                players.addExpPts(adr,2);
            } else {
                players.addExpPts(adr,5);
                players.changeArmy(adr,quantity,true);
                players.updatePossessions(adr,attackedPlayer,true);
                emit newOwner(adr,team,to,attackedPlayer,nick,subs);
            }
        } else {
            players.changeArmy(adr,quantity,true);
            countries.changeArmy(attackedPlayer,(powerB.sub(powerA)).div(players.getLevelDefense(attackedPlayer)),to,false,nick,true);
            countries.setTimer(to);
            emit attackInflicted(adr,0,to,team,attackedPlayer,nick);
        }
    }

    //bomb cards
    function applyBombCard(address adr, uint index, string name) onlyLogic external returns(bool) {
        require(countries.getBlockLeft(name) == 0 && bombCard.applyBombCard(adr,index) == true);
        string memory team = players.getTeam(adr);
        string memory nick = players.getNickname(adr);
        if(countries.applyBombCard(adr,index,name, team, nick) == true) return true;
        else return false;
    }

}