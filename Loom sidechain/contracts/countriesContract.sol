pragma solidity ^0.4.15;

//pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./SafeMath.sol";

contract countriesContract is Ownable {

    using SafeMath for uint;

    struct Object {
        string name;
        uint price;
        address propertyOf;
        uint army;
        uint lifepoints;
        bool lock;
        uint timer;
    }

    Object[] public objects;
    address logicContract;
    address actionsContract;
    address marketplaceContract;
    address attacksContract;
    uint public objectsCreated;
    uint public basePrice;
    uint public height;

    mapping(string => Object) getObjByName;
    mapping(string => bool) isGenerated;

    event armyAdded(uint amount,string name, address adr, bool direction, string nick);
    event attackInflicted(address adr, uint num, string name, string team,address victim, string nick, uint subs);
    event bombInflicted(address adr, string name, uint index, address victim, string team, string nick);

    constructor(address adr) public {
        basePrice = 20000000000000000; //0.02eth
        logicContract = 0x0;
        owner = adr;
        Object memory newObj = Object("", 0, 0x0, 0, 0, false, 0);
        objects.push(newObj);
        objectsCreated = 0;
        height = now;
    }

    //MODIFIERS
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier timer(string name) {
        require(block.number > getObjByName[name].timer+20);
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
    function getExistence(string name) external view returns (bool) {
        if( isGenerated[name] == true ) return true;
        else return false;
    }

    function getPrice(string name) external view returns (uint) {
        if(isGenerated[name] == true ) return getObjByName[name].price;
        else return basePrice;
    }

    function getOwner(string name) public view returns (address) {
        return getObjByName[name].propertyOf;
    }

    function getBlockLeft(string name) public view returns(uint) {
        uint tmp = block.number.sub(getObjByName[name].timer);
        if( tmp > 20) return uint(0);
        else return uint(20).sub(tmp);
    }

    function getArmy(string name) external view returns (uint) {
        return getObjByName[name].army;
    }

    function getLifePoints(string name) external view returns (uint) {
        return getObjByName[name].lifepoints;
    }

    //Generator
    function newObject(address adr, string name) validAddress external returns(bool) {
        require(isGenerated[name] != true);
        Object memory newObj = Object(name, basePrice.mul(2), adr, 3, 100,false,0);
        isGenerated[name] = true;
        getObjByName[name].timer = block.number;
        objectsCreated = objectsCreated.add(1);
        objects.push(newObj);
        getObjByName[name] = objects[objects.length.sub(1)];
        return true;
    }

    //Set timer
    function setTimer(string name) validAddress external {
        getObjByName[name].timer = block.number;
    }

    //Change Owner
    function changeOwnership(string name, address adr, uint army, uint lifepoints) validAddress public returns(bool) {
        if( getObjByName[name].propertyOf != adr ) getObjByName[name].propertyOf = adr;
        if(army != 0) getObjByName[name].army = army;
        if(lifepoints != 0 ) getObjByName[name].lifepoints = lifepoints;

        return true;
    }

    //Add lifepoints
    function addLifePoints(string name, address adr, uint quantity) validAddress public returns(bool) {
        require( getObjByName[name].propertyOf == adr );
        getObjByName[name].lifepoints = getObjByName[name].lifepoints.add(quantity);
        return true;
    }

    //Add/remove army in/from state toggle = 1 add, toggle = 0 remove
    function changeArmy(address adr, uint quantity, string name, bool toggle, string nick, bool hide) validAddress external {
        if(hide == true) {
            getObjByName[name].army = quantity;
            return;
        }
        if(toggle == false) {
            require(quantity <= getObjByName[name].army && getObjByName[name].propertyOf == adr);
            getObjByName[name].army = getObjByName[name].army.sub(quantity);
            emit armyAdded(quantity, name, adr, false, nick);
        }
        else if(toggle == true) {
            require(getObjByName[name].propertyOf == adr && getObjByName[name].lock == false);
            getObjByName[name].army = getObjByName[name].army.add(quantity);
            emit armyAdded(quantity, name, adr, true, nick);
        }
    }

    //Buy an existing object
    function buyObject(string name, uint value) validAddress external {
        require(value >= getObjByName[name].price.add(getObjByName[name].price.div(10)));
        getObjByName[name].price = getObjByName[name].price.mul(2);
        getObjByName[name].timer = block.number;
    }

    //attack
    function attack(address adr,string team,uint damage, string name, uint subs, string nick) validAddress timer(name) external returns(bool) {
        if( getObjByName[name].lifepoints <= damage ) {
            changeOwnership(name,adr,subs,100);
            getObjByName[name].timer = block.number;
            return true;
            }
        else {
            emit attackInflicted(adr,damage,name, team, getOwner(name), nick, subs);
            getObjByName[name].army = 0;
            getObjByName[name].lifepoints = getObjByName[name].lifepoints.sub(damage);
            getObjByName[name].timer = block.number;
            return false;
        }
    }

    function applyBombCard(address adr, uint index, string name, string team, string nick) validAddress external timer(name) returns(bool) {
        bool exhit = false;
        address victim = getObjByName[name].propertyOf;
        if(index == 1) {
            getObjByName[name].lifepoints = getObjByName[name].lifepoints.div(2);
            emit bombInflicted(adr,name,index,victim,team,nick);
            exhit = true;
        }
        if(index == 2) {
            getObjByName[name].lifepoints = getObjByName[name].lifepoints.div(2);
            getObjByName[name].army = getObjByName[name].army.sub(getObjByName[name].army.div(4));
            emit bombInflicted(adr,name,index,victim,team,nick);
            exhit = true;
        }
        if(index == 3) {
            getObjByName[name].lifepoints = 1;
            getObjByName[name].army = 0;
            emit bombInflicted(adr,name,index,victim,team,nick);
            exhit = true;
        }
        getObjByName[name].timer = block.number;
        return exhit;
    }
}
