// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.8.4;


contract NFTicketize{ 

  event NewEvent(uint id, address creator, uint256 startDate, string metadataIpfsCid);

  struct Event {
    address creator;
    uint256 startDate;
    string metadataIpfsCid;
  }

  mapping(uint256 => Event) public events;
  uint256 eventCounter = 0 ;

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
}