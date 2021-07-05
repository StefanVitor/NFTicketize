// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "./rarible-contracts/erc-721/ERC721Rarible.sol";

contract NFTicketize is ERC721Rarible {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  enum ResellTicketType {
    Fixed,
    Percent
  }

  event NewEvent(uint256 id, address creator, uint256 startDate, string metadataIpfsCid);
  event NewTicketCategory(uint256 eventId, uint256 id, uint32 maxTickets, uint256 ticketPrice, uint32 resellTicketType, uint256 resellTicketValue, string metadataIpfsCid);

  struct Event {
    address creator;
    uint256 startDate;
    string metadataIpfsCid;
  }

  struct TicketCategory {
    uint256 eventId;
    uint32 maxTickets;
    uint256 ticketPrice;
    uint32 resellTicketType;
    uint256 resellTicketValue;
    string metadataIpfsCid;
  }

  mapping(uint256 => Event) public events;
  uint256 eventCounter = 0;
  
  mapping(uint256 => TicketCategory) public ticketCategories;
  uint256 ticketCategoryCounter = 0;

  constructor() NFTicketize("NFTicketize", "NFTICKET") {
  }

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

  function createTicketCategory(uint256 _eventId, uint32 _maxTickets, uint256 _ticketPrice, uint32 _resellTicketType, uint256 _resellTicketValue, string memory _metadataIpfsCid) public {
      uint256 currentTicketCategoryCounter = ticketCategoryCounter;
      TicketCategory memory _ticketCategory;
      _ticketCategory.eventId = _eventId;
      _ticketCategory.maxTickets = _maxTickets;
      _ticketCategory.ticketPrice = _ticketPrice;
      _ticketCategory.resellTicketType = _resellTicketType;
      _ticketCategory.resellTicketValue = _resellTicketValue;
      _ticketCategory.metadataIpfsCid = _metadataIpfsCid;
      ticketCategories[currentTicketCategoryCounter] = _ticketCategory;
      ticketCategoryCounter++;
      
      emit NewTicketCategory(_eventId, currentTicketCategoryCounter, _maxTickets, _ticketPrice, _resellTicketType, _resellTicketValue, _metadataIpfsCid);
  }

}