const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "0.0.0.0",
      port: 8545,
      network_id: "1624547455630"
    }
  }, 
  compilers: {
    solc: {
      version: "0.8.4"
    }
 }
};
