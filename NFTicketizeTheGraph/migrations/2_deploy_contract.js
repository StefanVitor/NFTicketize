const NFTicketize = artifacts.require('./NFTicketize.sol');

module.exports = async function(deployer) {
  await deployer.deploy(NFTicketize);
}
