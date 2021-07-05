// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.8.4;


contract NFTicketize{ 

  struct EventForTicket {
    address creator;
    uint256 startDate;
  }

  mapping(uint256 => EventForTicket) public eventsForTicket;
  uint256 eventForTicketCounter = 0;


  function createEvent(uint256 _startDate) public returns(uint256) {
      eventsForTicket[eventForTicketCounter] = EventForTicket(msg.sender, _startDate);
      eventForTicketCounter++;
      return eventForTicketCounter;
  }

  function getEventForTicketCounter() public view returns(uint256) {
      return eventForTicketCounter;
  }

  function getEvent(uint256 _eventId) public view returns (EventForTicket memory) {
      return eventsForTicket[_eventId];
  }
}