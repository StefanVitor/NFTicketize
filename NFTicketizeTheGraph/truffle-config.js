var HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = 'oxygen pact elegant novel toilet borrow total science age lazy rule hero swift brass cheap';

module.exports = {
  networks: {
    development: {
      host: "0.0.0.0",
      port: 8545,
      network_id: '*'
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/340a34e1cb804961bdd06d522315ff9e");
      },
      network_id: 3,
      gas: 5000000      //make sure this gas allocation isn't over 4M, which is the max
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://rinkeby.infura.io/v3/340a34e1cb804961bdd06d522315ff9e");
      },
      network_id: 4,
      gas: 5000000      //make sure this gas allocation isn't over 4M, which is the max
    }
  }, 
  compilers: {
    solc: {
      version: "0.7.6",
      optimizer: {
        enabled: true,
        runs: 200
      } 
    }
 }
};
