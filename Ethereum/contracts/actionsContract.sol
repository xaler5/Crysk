pragma solidity ^0.4.23;
//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./playersContract.sol";
import "./countriesContract.sol";

contract actionsContract is Ownable {

    using SafeMath for uint;

    address public logicAdr;

    playersContract players;
    countriesContract countries;

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
        logicAdr = 0x0;
        owner = adr;//msg.sender;//0xBB9CAE0071054774d47B3299EFb1E6e3ef1153d1;
        players = playersContract(0x0);
        countries = countriesContract(0x0);
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


//--------------------State changing functions------------------------------------------//

    //PLAYER ACTIONS
    //toggle==0 attackDMG, toggle==1 defense
    function upgradePower(address adr, bool toggle) onlyLogic external {
        players.upgradePower(adr, toggle);
    }

    function changeTeam(address adr, string name) onlyLogic external {
        require(keccak256(name) == keccak256("BTC") || keccak256(name) == keccak256("ETH") || keccak256(name) == keccak256("XRP") || keccak256(name) == keccak256("BCH") );
        if (players.getExistence(adr) != true) {
            require(players.newPlayer(adr)); 
        }
        players.changeTeam(adr,name);
    }

    function setNickName(address adr, string name) onlyLogic external {
        players.changeNickname(adr, name);
    }

    //COUNTRY ACTIONS
    function addArmyInState(address adr, uint quantity, string name) onlyLogic external{
        uint max = players.getArmy(adr);
        string memory nick = players.getNickname(adr);
        require(players.getExistence(adr) == true && quantity <= max);
        countries.changeArmy(adr,quantity,name,true, nick, false);
        players.changeArmy(adr, quantity, true);
    }

    function subArmyFromState(address adr, uint quantity, string name) onlyLogic external {
        require(players.getExistence(adr) == true);
        string memory nick = players.getNickname(adr);
        countries.changeArmy(adr,quantity,name,false, nick, false);
        players.changeArmy(adr, quantity, false);
    }
}