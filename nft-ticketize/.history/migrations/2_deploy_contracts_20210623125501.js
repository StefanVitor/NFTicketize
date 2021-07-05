var Events = artifacts.require("./Events.sol");
var NFTicketize = artifacts.require("./NFTicketize.sol");

module.exports = function(deployer) {
  deployer.deploy(Events);
  deployer.deploy(NFTicketize);
};
