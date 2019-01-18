const { writeFileSync, readFileSync } = require('fs')

const CryskToken = artifacts.require('./CryskToken.sol');
const gatewayAddress = readFileSync('../gateway_dappchain_address', 'utf-8');

var crysk = artifacts.require("./Crysk.sol"); //3.3 milioni di unitá di gas
var players = artifacts.require("./playersContract.sol"); //4 milioni di unitá di gas
var countries = artifacts.require("./countriesContract.sol"); //3.3 milioni di unitá di gas
var actions = artifacts.require("./actionsContract.sol"); //1.9 milioni di unitá di gas
var market = artifacts.require("./marketplaceContract.sol"); //2.9 milioni di unitá di gas
var attacks = artifacts.require("./attacksContract.sol"); //3 milioni di unitá di gas
var logic = artifacts.require("./logicContract.sol"); //3.3 milioni di unitá di gas
var bombCards = artifacts.require("./bombCards.sol"); //3.3 milioni di unitá di gas
var init = artifacts.require("./initializer.sol");
var address;

module.exports = function(deployer) {

	deployer.deploy(init).then(function(instance) {

		return address = instance.address}).then(function() {
		return deployer.deploy(crysk, address)}).then(function() {
		return deployer.deploy(players, address)}).then(function() {
		return deployer.deploy(countries, address)}).then(function() {
		return deployer.deploy(actions, address)}).then(function() {
		return deployer.deploy(market, address)}).then(function() {
		return deployer.deploy(attacks, address)}).then(function() {
		return deployer.deploy(logic, address)}).then(function() {
		return deployer.deploy(bombCards, address)}).then(function() {
			return deployer.deploy(GameTokenDappChain, gatewayAddress).then(async () => {
			  const CryskTokenInstance = await CryskToken.deployed();
			  writeFileSync('../crysk_token_address', CryskTokenInstance.address)
			})
		});

};
