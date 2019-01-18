pragma solidity ^0.4.23;

import "./Crysk.sol";
import "./logicContract.sol";
import "./playersContract.sol";
import "./countriesContract.sol";
import "./actionsContract.sol";
import "./marketplaceContract.sol";
import "./attacksContract.sol";
import "./Ownable.sol";

contract initializer is Ownable {

    Crysk crysk;
    logicContract logic;
    playersContract players;
    countriesContract countries;
    actionsContract actions;
    marketplaceContract marketplace;
    attacksContract attacks;
    bombCards bombCard;

    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function assignAdr(address cryskAdr, address logicAdr, address playersAdr, address countriesAdr, address actionsAdr, address marketplaceAdr, address attacksAdr, address bombCardAdr) onlyOwner external {
        crysk = Crysk(cryskAdr);
        logic = logicContract(logicAdr);
        players = playersContract(playersAdr);
        countries = countriesContract(countriesAdr);
        actions = actionsContract(actionsAdr);
        marketplace = marketplaceContract(marketplaceAdr);
        attacks = attacksContract(attacksAdr);
        bombCard = bombCards(bombCardAdr);
    }

    function initCrysk() onlyOwner external {
        
        crysk.setPlayerContract(address(players));
        crysk.setLogicContract(address(logic));
        crysk.setmarketplaceContract(address(marketplace));
        crysk.setCountryContract(address(countries));
        crysk.setBombCardContract(address(bombCard));
        
    }   

    function initLogic() onlyOwner external {

        logic.setmarketPlaceContract(address(marketplace));
        logic.setInterfaceAddress(address(crysk));
        logic.setCountriesContract(address(countries));
        logic.setPlayersContract(address(players));
        logic.setactionsContract(address(actions));
        logic.setattacksContract(address(attacks));
    }

    function initMarket() onlyOwner external{

        marketplace.setLogicAddress(address(logic));
        marketplace.setCountriesContract(address(countries));
        marketplace.setPlayersContract(address(players));
        marketplace.setBombCardContract(address(bombCard));
    }

    function initAttack() onlyOwner external{

        attacks.setLogicAddress(address(logic));
        attacks.setCountriesContract(address(countries));
        attacks.setPlayersContract(address(players));
        attacks.setBombCardContract(address(bombCard));
    }

    function initActions() onlyOwner external{
        actions.setLogicAddress(address(logic));
        actions.setCountriesContract(address(countries));
        actions.setPlayersContract(address(players));

    }

    function initDatabase() onlyOwner external{

        players.setValidAddress(address(logic), address(actions), address(marketplace), address(attacks));
        countries.setValidAddress(address(logic), address(actions), address(marketplace), address(attacks));
    }

    function initBombCard() onlyOwner external {

        bombCard.setMarketPlaceContract(address(marketplace));
        bombCard.setattacksContract(address(attacks));
    }
        
}