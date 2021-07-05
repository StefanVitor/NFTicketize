// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";


contract NFTicketize is ERC721 , RoyaltiesV2Impl {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event NewEvent(uint256 id, address creator, uint256 startDate, string metadataIpfsCid);

    event NewTicketCategory(uint256 eventId, uint256 id, uint32 maxTickets, uint256 ticketPrice, uint256 resellTicketValue, string metadataIpfsCid);

    event NewTicket(uint256 eventId, uint256 ticketCategoryId, uint256 id, uint32 forResell, uint256 resellPrice);

    struct Event {
        address payable creator;
        uint256 startDate;
        string metadataIpfsCid;
    }

    struct TicketCategory {
        uint256 eventId;
        uint32 maxTickets;
        uint256 ticketPrice;
        uint256 resellTicketValue;
        string metadataIpfsCid;
    }

    struct Ticket {
        uint256 eventId;
        uint256 ticketCategoryId;
        uint32 forResell;
        uint256 resellPrice;
    }

    mapping(uint256 => Event) public events;
    uint256 eventCounter = 0;
    
    mapping(uint256 => TicketCategory) public ticketCategories;
    uint256 ticketCategoryCounter = 0;

    mapping(uint256 => Ticket) public tickets;

    constructor() ERC721("NFTicketize", "NFTICKET") {
    
    }
/*
    function initialize() initializer public {
       __ERC721_init("NFTicketize", "NFTICKET");
    }*/

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

    function createTicketCategory(uint256 _eventId, uint32 _maxTickets, uint256 _ticketPrice, uint256 _resellTicketValue, string memory _metadataIpfsCid) public {
        uint256 currentTicketCategoryCounter = ticketCategoryCounter;
        TicketCategory memory _ticketCategory;
        _ticketCategory.eventId = _eventId;
        _ticketCategory.maxTickets = _maxTickets;
        _ticketCategory.ticketPrice = _ticketPrice;
        _ticketCategory.resellTicketValue = _resellTicketValue;
        _ticketCategory.metadataIpfsCid = _metadataIpfsCid;
        ticketCategories[currentTicketCategoryCounter] = _ticketCategory;
        ticketCategoryCounter++;
        
        emit NewTicketCategory(_eventId, currentTicketCategoryCounter, _maxTickets, _ticketPrice, _resellTicketValue, _metadataIpfsCid);
    }

    function customMint(
            address _to,
            uint256 _eventId,
            uint256 _ticketCategoryId,
            uint256[] memory _tokenIdsForMint,
            string memory _tokenURI
        ) external payable {

        Event memory _event = events[_eventId];
        TicketCategory memory _ticketCategory = ticketCategories[_ticketCategoryId];

        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        if (_ticketCategory.resellTicketValue > 0) {
            LibPart.Part memory _royalty;
            _royalty.account = _event.creator;
            _royalty.value = 10000 * uint96(_ticketCategory.resellTicketValue) / 100;
             _royalties[0] = _royalty;
        }

        (bool sent, bytes memory data) = _event.creator.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        for (uint counter = 0; counter < _tokenIdsForMint.length; counter++) {
            /*LibERC721LazyMint.Mint721Data memory _dataForMintAndTransfer;
            _dataForMintAndTransfer.tokenId = _tokenIdsForMint[counter];
            _dataForMintAndTransfer.royalties = _royalties;
            this.mintAndTransfer(_dataForMintAndTransfer, _to);*/
            _mint(_to, _tokenIdsForMint[counter]);
            _saveRoyalties(_tokenIdsForMint[counter], _royalties);
            _setTokenURI(_tokenIdsForMint[counter], _tokenURI);

            Ticket memory _ticket;
            _ticket.eventId = _eventId;
            _ticket.ticketCategoryId = _ticketCategoryId;
            _ticket.forResell = 0;
            _ticket.resellPrice = 0;
            tickets[_tokenIdsForMint[counter]] = _ticket;

            emit NewTicket(_eventId, _ticketCategoryId, _tokenIdsForMint[counter], 0, 0);
        }
    }
    /*
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
    }*/
    //TODO ADD ROYALTY
}