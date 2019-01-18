pragma solidity ^0.4.15;
//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";

contract playersContract is Ownable {

    using SafeMath for uint;

    struct Player {
        address adr;
        uint army;
        uint level;
        uint expPts;
        string team;
        uint armyDamage;
        uint armyDefense;
        uint totalOwned;
        uint upgrades;
    }

    Player[] public players;
    address logicContract;
    address actionsContract;
    address marketplaceContract;
    address attacksContract;
    uint public playersCreated;

    mapping(address => Player) player;
    mapping(address => bool) isPlayer;
    mapping(address => string) nicknames;

    event buyArmies(address adr);
    event playerCreated(address adr);
    event nextLevel(address adr, uint level, string team, string nick);
    event changedTeam(address adr, string name, string nick);
    event changedNickname(address adr, string nick, string oldnick);
    event upgraded(address adr, bool toggle);

    constructor(address adr) public {
        owner = adr;
        logicContract = 0x0;
        actionsContract = 0x0;
        marketplaceContract = 0x0;
        Player memory newPlayer = Player(0x0,0,0,0,"no team chosen",0,0,0,0);
        players.push(newPlayer);
        playersCreated = 0;
    }

    //MODIFIERS
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier validAddress  {
        require(msg.sender == logicContract || msg.sender == actionsContract || msg.sender == marketplaceContract || msg.sender == attacksContract);
        _;
    }

    //SET LOGIC CONTRACT
    function setValidAddress(address logicAdr, address actionsAdr, address marketPlaceAdr, address attacksAdr) onlyOwner external returns (bool) {
        logicContract = logicAdr;
        actionsContract = actionsAdr;
        marketplaceContract = marketPlaceAdr;
        attacksContract = attacksAdr;
    }

    //Getters
    function getNickname(address adr) external view returns (string) {
        if(isPlayer[adr] == true) return nicknames[adr];
        else return "";
    }

    function getExistence(address adr) external view returns (bool) {
        if( isPlayer[adr] == true ) return true;
        else return false;
    }

    function getLevelPower(address adr) external view returns(uint) {
        return player[adr].level.mul(player[adr].armyDamage);
    }

    function getLevelDefense(address adr) external view returns(uint) {
        return player[adr].level.mul(player[adr].armyDefense);
    }

    function getArmy(address adr) external view returns (uint) {
        return player[adr].army;
    }

    function getLevel(address adr) external view returns (uint) {
        return player[adr].level;
    }

    function getExpPts(address adr) external view returns (uint) {
        return player[adr].expPts;
    }

    function getTeam(address adr) external view returns (string) {
        return player[adr].team;
    }

    function getArmyDamage(address adr) external view returns (uint) {
        return player[adr].armyDamage;
    }

    function getArmyDefense(address adr) external view returns (uint) {
        return player[adr].armyDefense;
    }

    function getTotalOwned(address adr) external view returns (uint) {
        return player[adr].totalOwned;
    }

    function getUpgrades(address adr) external view returns (uint) {
        return player[adr].upgrades;
    }

    //Controllers
    function checkLevelExp(address adr) validAddress public returns (bool) {
        if(player[adr].expPts > player[adr].level.mul(50) && player[adr].level < 10 ) {
            player[adr].level = player[adr].level.add(1);
            player[adr].expPts = 0;
            player[adr].upgrades = player[adr].upgrades.add(1);
            emit nextLevel(adr, player[adr].level, player[adr].team, nicknames[adr]);
            return true;
        }
        else return false;
    }

    //Generator
    function newPlayer(address adr) validAddress external returns(bool) {
        require(isPlayer[adr] != true);
        Player memory _newPlayer = Player(0x0,0,1,0,"no team chosen",1,1,0,0);
        players.push(_newPlayer);
        player[adr] = players[players.length.sub(1)];
        isPlayer[adr] = true;
        playersCreated = playersCreated.add(1);
        emit playerCreated(adr);
        return true;
    }

    //Buy armies
    function buyArmy(address adr, uint quantity, uint price, uint value) validAddress external {
        uint tmp = price.mul(quantity).div(player[adr].level);
        tmp = tmp.add(tmp.div(10));
        require(value >= tmp);
        player[adr].army = player[adr].army.add(quantity);
        emit buyArmies(adr);
    }

    //Update possessions, remove one and add one to players add expPts to the new owner if toggle=true just add to adr1
    function updatePossessions(address adr1, address adr2, bool toggle) validAddress external {
        player[adr1].totalOwned = player[adr1].totalOwned.add(1);
        if( adr2 != adr1 && toggle == true ) player[adr2].totalOwned = player[adr2].totalOwned.sub(1);
    }

    //Upgrades (toggle==0 attackDMG, toggle==1 defense)
    function upgradePower(address adr, bool toggle) validAddress external {
        require(player[adr].upgrades > 0);
        player[adr].upgrades = player[adr].upgrades.sub(1);
        if( toggle == false ) player[adr].armyDamage = player[adr].armyDamage.mul(2);
        else if (toggle == true) player[adr].armyDefense = player[adr].armyDefense.mul(2);
        emit upgraded(adr,toggle);
    }

    //Change team
    function changeTeam(address adr, string team) validAddress external {
        player[adr].team = team;
        emit changedTeam(adr, team, nicknames[adr]);
    }

    //Remove or add armies toggle=false add, toggle=true remove
    function changeArmy(address adr, uint amount, bool toggle) validAddress external {
        if(toggle == true ) player[adr].army = player[adr].army.sub(amount);
        else if (toggle == false ) player[adr].army = player[adr].army.add(amount);
    }

    //Add expPts (notice that reset to 0 once levelup is done in checkLevelExp() )
    function addExpPts(address adr, uint amount) validAddress external {
        player[adr].expPts = player[adr].expPts.add(amount);
        checkLevelExp(adr);

    }

    //Change nickname
    function changeNickname(address adr, string nick) validAddress external {
        string memory oldnick = nicknames[adr];
        nicknames[adr] = nick;
        emit changedNickname(adr, nick, oldnick);
    }


}
