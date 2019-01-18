# CRYSK

An ethereum blockchain based strategy game.

A demo version can be found at: 
	https://xaler5.github.io/

There is no max number of players. Everyone is playing on the same map live with all the others players.

Player's actions:

- Buy an empty country at a base price.
- Buy an already owned country paying the double of the previous price letting the old owner win a x1.9 and the dev a x0.1 of the paid price.
- Buy armies at a base price. This base price will be lower for higher player's levels.
- Add armies to an owned country to increase it's defense. When buying armies they are available for the player to be placed. Once placed they are substracted from player's available army.
- Attack a country with the player's available armies. Attack/Defense power so as the number of Armies play a role in determining the attack result in terms of damage points inflicted to the lifepoints of a country.
  If a country's lifepoints go below 1 then the country is conquered by the attacker. When attacking a damage is produced on both parties(lifepoints and number of armies for the victim and just number of armies for the attacker).
- Level up. When leveling up player can choose to upgrade Attack or Defense power. This will increase the corresponding attack/defense ability of each owned country.
- Buy cards. At the moment there are available 9 bombs cards (three of three different type) that can be bought and used on a country. Once bought the availability of each kind of card is reduced. Once used the card returns to the market and is again availabel to be bought. 
- Choose/change team between BTC ETH XRP and BCH (currently the top 4 market cap for cryptocurrencies). Teaming up can accelerate the world conquering of that team.

The first team that succeed in conquering all the planet win.

# How to deploy on Truffle 

    truffle.exe compile
    truffle.exe migrate --reset
	truffle.exe console

And from inside the truffle console follow the truffle-deploy-steps.txt commands one at time

# Explanation of various contracts:

Crysk.sol

		this is the main contract. It is the entry door for the entire ecosystem of smart contracts and is the one that interacts with the UI. Whatever action here is redirected to all the other contracts
		
actionsContract.sol

		this is the contract providing the player's actions (attack, buy, add/remove armies, change team....)

attacksContract.sol

		this contract provide all the methods for the attacks (with cards, with armies etc...)
		
bombCards.sol

		this contract provide the logic for the bomb cards available inside the game
		
countriesContract.sol

		this contract is a low-level contract which stores all the informations regarding the countries (owner, price, armies etc..) and which is also the endpoint of all the actions regarding finally a country
		
initializer.sol

		this contract is useful to link all the contracts together with their address. Without this contract the process is manual and tedious. So this is the contract that need to run before each production use and exactly after each deployment of new contracts.
		this contract is also useful for any change in contracts because it can reassign linkings letting the game being upgradable inside the blockchain.
		
logicContract.sol

		this is the contract that has the logic of all actions coming from other contracts. It is the busiest one since others contract are in big part just calls to other contracts.
		
marketplaceContract.sol

		this is the contract that manage all the transactions while buying cards/armies.

playersContract.sol

		like countriesContract this is the same regarding users. So this contract take the count of all the owned countries/player's level/number of armies etc


# Known bugs

- Complete the duplicated names protections because you can still create "Niger" or "niger" making it problematic for further variables readings

# Future improvements

- Decide wether putting the win process into blockchain or not
- Check solidity best practices in https://consensys.github.io/smart-contract-best-practices/
- Fix mobile zoom bugs
- Remove internal functions from logicContract.sol since they are not used anymore
