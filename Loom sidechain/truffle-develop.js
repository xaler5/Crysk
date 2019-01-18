module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
	  gas: 7000000,
	  gasPrice: 4000000000 // 4 Gwei
    }
  }
};