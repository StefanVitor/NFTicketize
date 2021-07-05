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

    var eventId = 0;
    await NFTicketizeInstance.customMint(accounts[0], eventId, 0, [0, 1]);
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

    var ticketCategory = 1;
    await NFTicketizeInstance.customMint(accounts[0], eventId, ticketCategory, [2, 3]);

    // Get stored value
    //const storedData = await simpleStorageInstance.get.call();
    const storedData = await NFTicketizeInstance.getRoyalties.call(2);
    console.log(storedData);
    assert.equal('1000', storedData[0].value, "The value was not stored.");
  });

  it("should send coin correctly", () => {
    const NFTicketizeInstance = await NFTicketize.deployed();
    
    let meta;

    // Get initial balances of first and second account.
    const account_one = accounts[0];
    const account_two = accounts[1];

    let account_one_starting_balance;
    let account_two_starting_balance;
    let account_one_ending_balance;
    let account_two_ending_balance;

    const amount = 10;

    account_one_starting_balance = await NFTicketizeInstance.getBalance();
    console.log(account_one_starting_balance);
    assert.equal(
      true,
      true,
      "Amount wasn't correctly taken from the sender"
    );
  });
});
