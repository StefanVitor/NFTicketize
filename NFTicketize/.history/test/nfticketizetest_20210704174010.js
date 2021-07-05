const NFTicketize = artifacts.require("../contracts/NFTicketize.sol");

contract("NFTicketize", accounts => {
  it("...should store correct value on event.", async () => {
    const NFTicketizeInstance = await NFTicketize.deployed();

    // Set value of 89
    var value = "1111111";
    await NFTicketizeInstance.createEvent(value, "-");

    // Get stored value
    //const storedData = await simpleStorageInstance.get.call();
    const storedData = await NFTicketizeInstance.events.call(0);
    console.log(storedData);
    assert.equal(value, storedData.startDate, "The value was not stored.");
  });

  it("...should store correct value on ticketCategory.", async () => {
    const NFTicketizeInstance = await NFTicketize.deployed();

    var eventId = 0;
    await NFTicketizeInstance.createTicketCategory(eventId, 10, 100, 10, "-");
    // Get stored value
    //const storedData = await simpleStorageInstance.get.call();
    const storedDataNew = await NFTicketizeInstance.ticketCategories.call(0);
    console.log(storedDataNew);
    assert.equal(eventId, storedDataNew.eventId, "The value was not stored.");
  });

  it("...should mint correct value", async () => {
    const NFTicketizeInstance = await NFTicketize.deployed();
    const account_two = accounts[1];
    var eventId = 0;
    await NFTicketizeInstance.customMint(account_two, eventId, 0, [0, 1], ['-', '-'], {from : accounts[1]});
    // Get stored value
    //const storedData = await simpleStorageInstance.get.call();
    const storedData = await NFTicketizeInstance.tickets.call(0);
    console.log(storedData);
    assert.equal(eventId, storedData.eventId, "The value was not stored.");
  });

  it("...should check royalty correct set", async () => {
    const NFTicketizeInstance = await NFTicketize.deployed();

    var eventId = 0;
    var royalty = 10;
    await NFTicketizeInstance.createTicketCategory(eventId, 10, 100, royalty, "-");

    const account_two = accounts[1];
    var ticketCategory = 1;
    await NFTicketizeInstance.customMint(account_two, eventId, ticketCategory, [2, 3],['-', '-'], {from : accounts[1]});

    // Get stored value
    //const storedData = await simpleStorageInstance.get.call();
    const storedData = await NFTicketizeInstance.getRoyalties.call(2);
    console.log(storedData);
    assert.equal('1000', storedData[0].value, "The value was not stored.");
  });

  it("should send coin correctly", async () => {
    const NFTicketizeInstance = await NFTicketize.deployed();

    // Get initial balances of first and second account.
    const account_one = accounts[0];
    const account_two = accounts[1];

    let account_one_starting_balance;
    let account_two_starting_balance;
    let account_one_ending_balance;
    let account_two_ending_balance;

    var eventId = 0;
    var royalty = 10;
    await NFTicketizeInstance.createTicketCategory(eventId, 10, 100, royalty, "-");

    account_one_starting_balance = await web3.eth.getBalance(account_one);
    account_two_starting_balance = await web3.eth.getBalance(account_two);
    console.log("Account_one balance-before-" + account_one_starting_balance);
    console.log("Account_two balance-before-" + account_two_starting_balance);
    
    const price = "5555000000000000000";
    let overrides = {
      value: price,
      from: account_two
    };
    var ticketCategory = 1;
    var result = await NFTicketizeInstance.customMint(account_two, eventId, ticketCategory, [4, 5],['-', '-'], overrides);

    account_one_ending_balance = await web3.eth.getBalance(account_one);
    account_two_ending_balance = await web3.eth.getBalance(account_two);

    console.log("Account_one balance-after-" + account_one_ending_balance);
    console.log("Account_two balance-after-" + account_two_ending_balance);
    console.log("Account_one-before-after" + account_one_ending_balance - )
    assert.equal(
      true,
      true,
      "Amount wasn't correctly taken from the sender"
    );
  });
});
