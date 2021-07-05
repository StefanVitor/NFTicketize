// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.8.4;

contract NFTicketize{ 

  uint16 priceExponent = 1000;

  enum ResellTicketType {
    Fixed,
    Percent
  }

  event NewEvent(uint256 id, address creator, uint256 startDate, string metadataIpfsCid);
  event NewTicketCategory(uint256 eventId, uint256 id, uint32 maxTickets, uint32 ticketPrice, uint256 resellTicketType, uint32 resellTicketValue, string metadataIpfsCid);

  struct Event {
    address creator;
    uint256 startDate;
    string metadataIpfsCid;
  }

  struct TicketCategory {
    uint256 eventId;
    uint32 maxTickets;
    uint32 ticketPrice;
    uint256 resellTicketType;
    uint32 resellTicketValue;
    string metadataIpfsCid;
  }

  mapping(uint256 => Event) public events;
  uint256 eventCounter = 0;
  
  mapping(uint256 => TicketCategory) public ticketCategories;
  uint256 ticketCategoryCounter = 0;

  function createEvent(uint256 _startDate, string memory _metadataIpfsCid) public {
      uint256 currentEventCounter = eventCounter;
      Event memory _event;
      _event.creator = msg.sender;
      _event.startDate = _startDate;
      _event.metadataIpfsCid = _metadataIpfsCid;
      events[currentEventCounter] = _event;
      eventCounter++;
      
      emit NewEvent(currentEventCounter, msg.sender, _startDate, _metadataIpfsCid);
  }

  function createTicketCategory(uint256 _eventId, uint32 _maxTickets, uint32 _ticketPrice, uint256 _resellTicketType, uint32 _resellTicketValue, string memory _metadataIpfsCid) public {
      uint256 currentTicketCategoryCounter = ticketCategoryCounter;
      TicketCategory memory _ticketCategory;
      _ticketCategory.eventId = _eventId;
      _ticketCategory.maxTickets = _maxTickets;
      _ticketCategory.ticketPrice = _ticketPrice * priceExponent;
      _ticketCategory.resellTicketType = _resellTicketType;
      _ticketCategory.resellTicketValue = _resellTicketValue;
      _ticketCategory.metadataIpfsCid = _metadataIpfsCid;
      ticketCategories[currentTicketCategoryCounter] = _ticketCategory;
      ticketCategoryCounter++;
      
      emit NewTicketCategory(_eventId, currentTicketCategoryCounter, _maxTickets, _ticketPrice, _resellTicketType, _resellTicketValue, _metadataIpfsCid);
  }
}