// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";

contract NFTicketize is ERC721 , RoyaltiesV2Impl  {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event NewEvent(uint256 id, address creator, uint256 startDate, string metadataIpfsCid);

    event NewTicketCategory(uint256 eventId, uint256 id, uint32 currentMintTickets, uint32 maxTickets, uint256 ticketPrice, uint256 resellTicketValue, string metadataIpfsCid);
    
    event UpdateTicketCategory(uint256 eventId, uint256 id, uint32 currentMintTickets, uint32 maxTickets, uint256 ticketPrice, uint256 resellTicketValue, string metadataIpfsCid);
    
    event NewTicket(uint256 eventId, uint256 ticketCategoryId, uint256 id, uint32 forBid);

    event UpdateTicket(uint256 eventId, uint256 ticketCategoryId, uint256 id, uint32 forBid);

    struct Event {
        address payable creator;
        uint256 startDate;
        string metadataIpfsCid;
        bool exist;
    }

    struct TicketCategory {
        uint256 eventId;
        uint32 currentMintTickets;
        uint32 maxTickets;
        uint256 ticketPrice;
        uint256 resellTicketValue;
        string metadataIpfsCid;
        bool exist;
    }

    struct Ticket {
        uint256 eventId;
        uint256 ticketCategoryId;
        uint32 forBid;
    }

    mapping(uint256 => Event) public events;
    uint256 eventCounter = 0;
    
    mapping(uint256 => TicketCategory) public ticketCategories;
    uint256 ticketCategoryCounter = 0;

    mapping(uint256 => Ticket) public tickets;

    constructor() ERC721("NFTicketize", "NFTICKET") {
    
    }

    //Modifier to check if event exist
    modifier eventExists(uint256 _eventId) {
        require(events[_eventId].exist, "Event does not exist.");
        _;
    }

    //Modified to check if ticket category exist 
    modifier ticketCategoryExist(uint256 _ticketCategory) {
        require(ticketCategories[_ticketCategory].exist, "Ticket category does not exist.");
        _;
    }

    //Modified to check if ticket category is for that event 
    modifier ticketCategoryEventExist(uint256 _eventId, uint256 _ticketCategory) {
        require(ticketCategories[_ticketCategory].eventId == _eventId, "Ticket category does not exist.");
        _;
    }

    // Modifier to check that the caller is the owner of event
    modifier onlyEventOwner(uint256 _eventId) {
        Event memory _event = events[_eventId];
        require(msg.sender == _event.creator, "Not event owner.");
        _;
    }

    // Modifier to check that the caller is not the owner of event
    modifier isNotEventOwner(uint256 _eventId) {
        Event memory _event = events[_eventId];
        require(msg.sender != _event.creator, "Caller is event owner.");
        _;
    }

    // Update ticket number
    function updateTicketCategoryNewTicket(uint256 _eventId, uint256 _ticketCategoryId) internal {
        ticketCategories[_ticketCategoryId].currentMintTickets = ticketCategories[_ticketCategoryId].currentMintTickets + 1;
        emit UpdateTicketCategory(_eventId, _ticketCategoryId, ticketCategories[_ticketCategoryId].currentMintTickets, 
                ticketCategories[_ticketCategoryId].maxTickets,ticketCategories[_ticketCategoryId].ticketPrice, 
                ticketCategories[_ticketCategoryId].resellTicketValue, ticketCategories[_ticketCategoryId].metadataIpfsCid);
    }
    
    // Create new event
    function createEvent(uint256 _startDate, string memory _metadataIpfsCid) public {
        uint256 currentEventCounter = eventCounter;
        Event memory _event;
        _event.creator = msg.sender;
        _event.startDate = _startDate;
        _event.metadataIpfsCid = _metadataIpfsCid;
        _event.exist = true;
        events[currentEventCounter] = _event;
        eventCounter++;
        
        emit NewEvent(currentEventCounter, msg.sender, _startDate, _metadataIpfsCid);
    }

    // Create new ticket category
    function createTicketCategory(uint256 _eventId, 
            uint32 _maxTickets, 
            uint256 _ticketPrice, 
            uint256 _resellTicketValue, 
            string memory _metadataIpfsCid
    ) public 
            eventExists(_eventId) 
            onlyEventOwner(_eventId) {
        uint256 currentTicketCategoryCounter = ticketCategoryCounter;
        TicketCategory memory _ticketCategory;
        _ticketCategory.eventId = _eventId;
        _ticketCategory.currentMintTickets = 0;
        _ticketCategory.maxTickets = _maxTickets;
        _ticketCategory.ticketPrice = _ticketPrice;
        _ticketCategory.resellTicketValue = _resellTicketValue;
        _ticketCategory.metadataIpfsCid = _metadataIpfsCid;
        _ticketCategory.exist = true;
        ticketCategories[currentTicketCategoryCounter] = _ticketCategory;
        ticketCategoryCounter++;
        
        emit NewTicketCategory(_eventId, currentTicketCategoryCounter, 0, _maxTickets, _ticketPrice, _resellTicketValue, _metadataIpfsCid);
    }

    function fillInformationsAboutTicket(
            uint256 _eventId,
            uint256 _ticketCategoryId,
            uint256[] memory _tokenIdsForMint
    ) external payable 
            eventExists(_eventId) 
            ticketCategoryExist(_ticketCategoryId)
            ticketCategoryEventExist(_eventId, _ticketCategoryId)
            isNotEventOwner(_eventId) {

        // Check if there is tickets for sell
        require(ticketCategories[_ticketCategoryId].currentMintTickets <= ticketCategories[_ticketCategoryId].maxTickets, "Tickets for this category are sold.");

        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        if (ticketCategories[_ticketCategoryId].resellTicketValue > 0) {
            LibPart.Part memory _royalty;
            _royalty.account = events[_eventId].creator;
            _royalty.value = 10000 * uint96(ticketCategories[_ticketCategoryId].resellTicketValue) / 100;
             _royalties[0] = _royalty;
        }

        (bool sent, bytes memory data) = events[_eventId].creator.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        // Check is enough ETH sent
        require(msg.value == _tokenIdsForMint.length * ticketCategories[_ticketCategoryId].ticketPrice);

        for (uint counter = 0; counter < _tokenIdsForMint.length; counter++) {
            //Save royalties for Rarible
            _saveRoyalties(_tokenIdsForMint[counter], _royalties);

            Ticket memory _ticket;
            _ticket.eventId = _eventId;
            _ticket.ticketCategoryId = _ticketCategoryId;
            _ticket.forBid = 0;
            tickets[_tokenIdsForMint[counter]] = _ticket;
            emit NewTicket(_eventId, _ticketCategoryId, _tokenIdsForMint[counter], 0);
            
            //Update current tickets for ticketCategory
            updateTicketCategoryNewTicket(_eventId, _ticketCategoryId);
        }
    }
    
     function mintAndTransfer(
        LibERC721LazyMint.Mint721Data memory data,
        address to
    ) external {
        _mint(to, data.tokenId);
        _saveRoyalties(data.tokenId, data.royalties);
    }
    
    function transferFromOrMint(
        LibERC721LazyMint.Mint721Data memory _data,
        address _from,
        address payable _to
    ) external {
        if (_exists(_data.tokenId)) {
            safeTransferFrom(_from, _to, _data.tokenId);
        } else {
            this.mintAndTransfer(_data, _to);
        }
    }

    function setTicketForBid(uint256 _tokenId, uint32 _value) public {
        Ticket memory _ticket = tickets[_tokenId];
        _ticket.forBid = _value;
        tickets[_tokenId] = _ticket;

        emit UpdateTicket(_ticket.eventId, _ticket.ticketCategoryId, _tokenId, _value);
    }
}