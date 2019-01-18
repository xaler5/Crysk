const playersartifacts = require('./build/contracts/playersContract.json')
const Cryskartifacts = require('./build/contracts/Crysk.json')
const countriesartifacts = require('./build/contracts/countriesContract.json')
const actionsartifacts = require('./build/contracts/actionsContract.json')
const marketplaceartifacts = require('./build/contracts/marketplaceContract.json')
const attacksartifacts = require('./build/contracts/attacksContract.json')
const logicartifacts = require('./build/contracts/logicContract.json')
const initializerartifacts = require('./build/contracts/initializer.json')

const playersContract = require('truffle-contract')
const countriesContract = require('truffle-contract')
const Crysk = require('truffle-contract')
const actionsContract = require('truffle-contract')
const marketplaceContract = require('truffle-contract')
const attacksContract = require('truffle-contract')
const logicContract = require('truffle-contract')
const initializer = require('truffle-contract')

const MyPlayerContract = playersContract(playersartifacts);
const MyCountryContract = countriesContract(countriesartifacts);
const MyCryskContract = Crysk(Cryskartifacts);
const MyActionContract = actionsContract(actionsartifacts);
const MyMarketContract = marketplaceContract(marketplaceartifacts);
const MyAttackContract = attacksContract(attacksartifacts);
const MyLogicContract = logicContract(logicartifacts);
const MyInitContract = initializer(initializerartifacts);

MyPlayerContract.setProvider(web3.currentProvider);
MyCountryContract.setProvider(web3.currentProvider);
MyCryskContract.setProvider(web3.currentProvider);
MyActionContract.setProvider(web3.currentProvider);
MyMarketContract.setProvider(web3.currentProvider);
MyAttackContract.setProvider(web3.currentProvider);
MyLogicContract.setProvider(web3.currentProvider);
MyInitContract.setProvider(web3.currentProvider);

var initer;

MyInitContract.deployed().then(function(instance) {
    initer = instance;
	return instance.assignAdr.call(MyCryskContract.address,MyLogicContract.address,MyPlayerContract.address,MyCountryContract.address,MyActionContract.address,MyMarketContract.address,AttackContract.address);
}).then(function(balance) {
    return initer.initCrysk()}).then(function(){
		return initer.initLogic()}).then(function() {
			return initer.initMarket()}).then(function() {
				return initer.initAttack()}).then(function() {
					return initer.initActions()}).then(function() {
						return initer.initDatabase()});