var HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = 'oxygen pact elegant novel toilet borrow total science age lazy rule hero swift brass cheap';
const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "0.0.0.0",
      port: 8545,
      network_id: "5777"
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/340a34e1cb804961bdd06d522315ff9e")
      },
      network_id: 3,
      gas: 20000000      //make sure this gas allocation isn't over 4M, which is the max
    }
  }, 
  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
        enabled: true, // Default: false
        runs: 1000 // Default: 200
      },
    }
  }
 }
};
