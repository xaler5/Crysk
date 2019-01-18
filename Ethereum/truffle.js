var HDWalletProvider = require("truffle-hdwallet-provider");
var infura_apikey = "bN8PlZ7jAfVIGb0dR4yp";
var mnemonic = "off dwarf embrace sense glide draw identify into true sign visa ceiling";
module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"+infura_apikey),
      network_id: 3,
	  gas: 4700000,
	  gasPrice: 10000000000 // 10 Gwei
    },
	rinkeby: {
      provider: new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/"+infura_apikey),
      network_id: 3,
	  gas: 7000000,
	  gasPrice: 4000000000 // 4 Gwei
    }
  }
};

//0xc75c2c010ed1dc7f868f09bdab647878b68d5780 ropsten account
//deploy with truffle migrate --network ropsten