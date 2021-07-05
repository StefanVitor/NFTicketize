// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.8.4;


contract NFTicketize{ 

  struct Event {
    address creator;
    uint256 startDate;
  }

  mapping(uint256 => Event) public events;
  uint256 eventCounter = 0 ;

  function createEvent(uint256 _startDate) public returns(uint256 eventId) {
      Event memory _event;
      _event.creator = msg.sender;
      _event.startDate = _startDate;
      events[eventCounter] = _event;
      eventCounter++;
      return eventCounter;
  }
}