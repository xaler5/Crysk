pragma solidity ^0.4.15;

import "./SafeMath.sol";
import "./Ownable.sol";

contract bombCards is Ownable {

    using SafeMath for uint;

    struct card {
        uint price;
        uint armyDamage; //%
        uint lifepointsDamage; //%
        uint delay;
        address owner;
    }

    card[3] firstCards;
    card[3] secondCards;
    card[3] thirdCards;

    mapping(address => uint) cardsOwned;
    mapping(address => uint) firstCardsOwned;
    mapping(address => uint) secondCardsOwned;
    mapping(address => uint) thirdCardsOwned;

    address marketplaceContract;
    address attacksContract;

    modifier validAddress  {
        require(msg.sender == marketplaceContract || msg.sender == attacksContract);
        _;
    }

    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    event buycard(address adr,uint index, uint intIndex);
    event cardAvailable(uint index);

    constructor (address adr) public {

        marketplaceContract = 0x0;
        attacksContract = 0x0;
        owner = adr;

        card memory tmpCard = card(8000000000000000,0,25,0,0x0);
        firstCards[0] = tmpCard;
        firstCards[1] = tmpCard;
        firstCards[2] = tmpCard;

        tmpCard = card(10000000000000000,25,50,0,0x0);
        secondCards[0] = tmpCard;
        secondCards[1] = tmpCard;
        secondCards[2] = tmpCard;

        tmpCard = card(15000000000000000,50,99,0,0x0);
        thirdCards[0] = tmpCard;
        thirdCards[1] = tmpCard;
        thirdCards[2] = tmpCard;

    }

    function setMarketPlaceContract(address adr) onlyOwner external returns(bool) {
        marketplaceContract = adr;
        return true;
    }

    function setattacksContract(address adr) onlyOwner external returns(bool) {
        attacksContract = adr;
        return true;
    }

    //--------------------- Getters -------------------------------------------------------//

    //This return an array of values of owned cards by address for every index
    function getUserCards(address adr) external view returns(uint[3]) {
        return [firstCardsOwned[adr], secondCardsOwned[adr], thirdCardsOwned[adr]];
    }

    function getFreeIndex(uint cardNum) internal view returns(uint) {
        uint index = 3;
        if(cardNum == 1) {
            if(firstCards[0].owner == 0x0000000000000000000000000000000000000000) index = 0;
            if(firstCards[1].owner == 0x0000000000000000000000000000000000000000) index = 1;
            if(firstCards[2].owner == 0x0000000000000000000000000000000000000000) index = 2;
        }
        if(cardNum == 2) {
            if(secondCards[0].owner == 0x0000000000000000000000000000000000000000) index = 0;
            if(secondCards[1].owner == 0x0000000000000000000000000000000000000000) index = 1;
            if(secondCards[2].owner == 0x0000000000000000000000000000000000000000) index = 2;
        }
        if(cardNum == 3) {
            if(thirdCards[0].owner == 0x0000000000000000000000000000000000000000) index = 0;
            if(thirdCards[1].owner == 0x0000000000000000000000000000000000000000) index = 1;
            if(thirdCards[2].owner == 0x0000000000000000000000000000000000000000) index = 2;
        }
        return index;
    }

    //This return the first free  it finds (so also the number of available cards for that index);
    function getAvailability(uint index) public view returns(uint) {
        uint available = 0;
        for(uint i = 0; i<3; i++) {
            if(index == 1 && firstCards[i].owner == 0x0000000000000000000000000000000000000000) available = available.add(1);
            else if(index == 2 && secondCards[i].owner == 0x0000000000000000000000000000000000000000) available = available.add(1);
            else if(index == 3 && thirdCards[i].owner == 0x0000000000000000000000000000000000000000) available = available.add(1);
        }
        return available;
    }

    function getPrice(uint index) public view returns(uint) {
        if(index == 1) return firstCards[0].price;
        if(index == 2) return secondCards[0].price;
        if(index == 3) return thirdCards[0].price;
    }

    //--------------------- Internals -------------------------------------------------------//

    function checkOwnership(address adr, uint index) public view returns(bool) {
        bool exhit = false;
        for(uint i = 0; i<3; i++) {
            if(index == 1 && firstCards[i].owner == adr) exhit = true;
            if(index == 2 && secondCards[i].owner == adr) exhit = true;
            if(index == 3 && thirdCards[i].owner == adr) exhit = true;
        }
        return exhit;
    }

    //This checks if it has at least one and return true
    function changeOwnership(address adr, uint index) internal returns(address) {
        for(uint i = 0; i<3; i++) {
            if(index == 1 && firstCards[i].owner == adr) {
                firstCards[i].owner = 0x0000000000000000000000000000000000000000;
                return firstCards[i].owner;
            }
            if(index == 2 && secondCards[i].owner == adr) {
                secondCards[i].owner = 0x0000000000000000000000000000000000000000;
                return secondCards[i].owner;
            }
            if(index == 3 && thirdCards[i].owner == adr) {
                thirdCards[i].owner = 0x0000000000000000000000000000000000000000;
                return thirdCards[i].owner;
            }
        }
    }

    //--------------------- Setters -------------------------------------------------------//

    //buy
    function buyCard(uint index, address adr, uint value) external validAddress {
        uint tmp = getFreeIndex(index);
        require(cardsOwned[adr] < 3 && tmp < 3);
        cardsOwned[adr] = cardsOwned[adr].add(1);
        if(index == 1) {
            require(value >= firstCards[tmp].price);
            firstCardsOwned[adr] = firstCardsOwned[adr].add(1);
            firstCards[tmp].owner = adr;
        }
        if(index == 2) {
            require(value >= secondCards[tmp].price);
            secondCardsOwned[adr] = secondCardsOwned[adr].add(1);
            secondCards[tmp].owner = adr;
        }
        if(index == 3) {
            require(value >= thirdCards[tmp].price);
            thirdCardsOwned[adr] = thirdCardsOwned[adr].add(1);
            thirdCards[tmp].owner = adr;
        }

        emit buycard(adr,index,tmp);
    }

    //apply
    function applyBombCard(address adr, uint index) external validAddress returns(bool) {
        require(checkOwnership(adr, index) == true);
        if(changeOwnership(adr,index) == 0x0000000000000000000000000000000000000000) emit cardAvailable(index);
        cardsOwned[adr] = cardsOwned[adr].sub(1);
        if(index == 1) {
            firstCardsOwned[adr] = firstCardsOwned[adr].sub(1);
        }
        if(index == 2) {
            secondCardsOwned[adr] = secondCardsOwned[adr].sub(1);
        }
        if(index == 3) {
            thirdCardsOwned[adr] = thirdCardsOwned[adr].sub(1);
        }
        return true;
    }

}
