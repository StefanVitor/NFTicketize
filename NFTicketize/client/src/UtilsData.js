import { EnvConstant} from "./const";
import axios from 'axios';
import { ApolloClient, InMemoryCache, gql} from '@apollo/client';
import { ethers } from "ethers";

const Web3EthAbi = require('web3-eth-abi');
const ethUtil = require('ethereumjs-util');
// IPFS initialization
const IPFS = require('ipfs-core');
let ipfs = null;

const uint8ArrayToString = require('uint8arrays/to-string');
const uint8ArrayConcat = require('uint8arrays/concat');
const all = require('it-all');

const defaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
    },
    query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
    },
};

const DOMAIN_TYPE = [
    {
      type: "string",
      name: "name"
    },
      {
          type: "string",
          name: "version"
      },
    {
      type: "uint256",
      name: "chainId"
    },
    {
      type: "address",
      name: "verifyingContract"
    }
];

function id(str) {
	return `0x${ethUtil.keccak256(str).toString("hex").substring(0, 8)}`;
}

const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

//Get my tickets filter by contract and event
async function getMyTicketsFilter(_ticketsDataItems, _eventId) {
    var data = [];
    for(var counter = 0; counter < _ticketsDataItems.length; counter++) {
        if (_ticketsDataItems[counter].contract.toLowerCase() === EnvConstant.contractAddress.toLowerCase()) {
            if (_eventId == null) {
                data.push(_ticketsDataItems[counter]);
            } else {
                const tokensQuery = `
                { tickets (where: { id: "0x` + Number(_ticketsDataItems[counter].tokenId).toString(16) + `" }) {
                    eventId
                }} `;
                var dataFromSubGraph = await ApolloClientCustom.query({
                    query: gql(tokensQuery)
                });
                var tickets = dataFromSubGraph.data.tickets;
                if (tickets.length > 0) {
                    if (parseInt(tickets[0].eventId) === _eventId) {
                        data.push(_ticketsDataItems[counter]);
                    }
                }
            }
        }
    }
    return data;
}

//Get tickets for sell filter by event and address
async function getTicketsForSellFilter(_ticketsDataItems, _eventId, _address) {
    var data = [];
    for(var counter = 0; counter < _ticketsDataItems.length; counter++) {
        if (_ticketsDataItems[counter].maker.toLowerCase() !== _address.toLowerCase() &&
        _ticketsDataItems[counter].take.assetType.assetClass === "ETH") {
            if (_eventId == null) {
                data.push(_ticketsDataItems[counter]);
            } else {
                const tokendId = _ticketsDataItems[counter].make.assetType.tokenId;
                const tokensQuery = `
                { tickets (where: { id: "0x` + Number(tokendId).toString(16) + `" }) {
                    eventId
                }} `;
                var dataFromSubGraph = await ApolloClientCustom.query({
                    query: gql(tokensQuery)
                });
                var tickets = dataFromSubGraph.data.tickets;
                if (tickets.length > 0) {
                    if (parseInt(tickets[0].eventId) === _eventId) {
                        data.push(_ticketsDataItems[counter]);
                    }
                }
            }
        }
    }
    return data;
}

export function CreateTypeData (domainData, primaryType, message, types) {
    return {
      types: Object.assign({
        EIP712Domain: DOMAIN_TYPE,
      }, types),
      domain: domainData,
      primaryType: primaryType,
      message: message
    };
}

// TheGraph initialization
export const ApolloClientCustom = new ApolloClient({
    uri: EnvConstant.theGraphAPIUrl,
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions
});

export const Provider = new ethers.providers.Web3Provider(window.ethereum); 

export const ERC20 = id("ERC20");
export const ERC721 = id("ERC721");
export const ETH = id("ETH");
export const ORDER_DATA_V1 = id("V1");
export const ZERO = "0x0000000000000000000000000000000000000000";

export const CreateIPFSRef = async() =>  {
    if (ipfs == null) {
      ipfs = await IPFS.create();
    }
    return ipfs;
}

export function enc(token, tokenId) {
	if (tokenId) {
		return Web3EthAbi.encodeParameters(["address", "uint256"], [token, tokenId]);
	} else {
		return Web3EthAbi.encodeParameter("address", token);
	}
}

export function StringToBoolean(string)
{
    if (!string) 
    {
        return false;
    }

    if (string.constructor === Boolean)
    {
        return string;
    }
    switch(string.toLowerCase().trim())
    {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}


export async function PrepareTx(hash, maker, amount) {
	const res = await axios.post(EnvConstant.raribleServer + `/protocol/v0.1/ethereum/order/orders/${hash}/prepareTx`, { maker, amount, payouts: [], originFees: [] })
	return res.data
}

// Get sell orders for one ticket (token)
export async function GetSellOrdersByItem(_ticketId, _continuation)  {
    var tickets;
    var newTickets;
    if (_continuation == null) {
        const ordersByItem =  await axios.get(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/order/orders/sell/byItem?contract=" + EnvConstant.contractAddress +"&tokenId=" + _ticketId + "&size=100");
        if (ordersByItem.data.orders.length > 0) {
            tickets = ordersByItem.data.orders;
            if (ordersByItem.data.continuation) {
                newTickets = await GetSellOrdersByItem(_ticketId, ordersByItem.data.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        }
    } else {
        const ordersByItem =  await axios.get(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/order/orders/sell/byItem?contract=" + EnvConstant.contractAddress +"&tokenId=" + _ticketId + "&size=100&continuation=" + _continuation);
        if (ordersByItem.data.orders.length > 0) {
            tickets = ordersByItem.data.orders;
            if (ordersByItem.data.continuation) {
                newTickets = await GetSellOrdersByItem(_ticketId, ordersByItem.data.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        } 
    }
    return [];
}

// Get my tickets
export async function GetMyTickets(_address, _continuation, _eventId)  {
    var tickets;
    var newTickets;
    if (_continuation == null) {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100`);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsFilter(itemsByOwner.data.items, _eventId);
        if (itemsByOwner.data.continuation) {
            newTickets = await GetMyTickets(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
                tickets.push(newTickets);
            }
        }
        return tickets;
      }
    } else {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100&continuation=` + _continuation);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsFilter(itemsByOwner.data.items, _eventId);
        if (itemsByOwner.data.continuation) {
            newTickets = await GetMyTickets(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
                tickets.push(newTickets);
            }
        }
        return tickets;
      } 
    }
    return [];
}

// Get tickets for sell
export async function GetTicketsForSell(_address, _continuation, _eventId)  {
    var tickets;
    var newTickets;
    if (_continuation == null) {
        // getSellOrdersByCollection from Rarible
        const ticketsForSell =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/order/orders/sell/byCollection?collection=` + EnvConstant.contractAddress + `&size=100`);
        const orders = ticketsForSell.data.orders;
        const continuation = ticketsForSell.data.continuation;
        if (orders.length > 0) {
            tickets = await getTicketsForSellFilter(orders, _eventId, _address);
            if (continuation) {
                newTickets = await GetTicketsForSell(_address, ticketsForSell.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        }
    } else {
        // getSellOrdersByCollection from Rarible
        const ticketsForSell =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/order/orders/sell/byCollection?collection=` +  EnvConstant.contractAddress + `&size=100&continuation=` + _continuation);
        const orders = ticketsForSell.data.orders;
        const continuation = ticketsForSell.data.continuation;
        if (orders.length > 0) {
            tickets = await getTicketsForSellFilter(orders.items, _eventId, _address);
            if (continuation) {
                newTickets = await GetTicketsForSell(_address, ticketsForSell.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        } 
    }
    return [];
}

// Get tickets for sell
export async function GetTicketsForBid(_address, _eventId)  {
    var data = [];
    var dataFromSubGraph = [];
    if (_eventId != null) {
        const ticketQuery = ` {
            tickets(where: { forBid: 1, eventId:"`+ _eventId +`" }) {
                id
            }
        }`;
        dataFromSubGraph = await ApolloClientCustom.query({
            query: gql(ticketQuery)
        });
    } else {
        const ticketQuery = ` {
            tickets(where: { forBid: 1 }) {
                id
            }
        }`;
        dataFromSubGraph = await ApolloClientCustom.query({
            query: gql(ticketQuery)
        });
    }

    var ticketsData = dataFromSubGraph.data.tickets;
    for(var counter = 0; counter < ticketsData.length; counter++) {
        const tokenId = parseInt(ticketsData[counter].id);
        const ticket = await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/` +  EnvConstant.contractAddress + `:` + tokenId);
        if (ticket.data.owners[0].toLowerCase() !== _address.toLowerCase()) {
            data.push(ticket.data);
        }
    }
    
    return data;  
}

//Get bids by item
export async function GetBidsByTicket(_ticketId, _continuation) {
    var tickets;
    var newTickets;
    if (_continuation == null) {
        // getSellOrdersByCollection from Rarible
        const ticketsForSell =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/order/orders/bids/byItem?contract=` + EnvConstant.contractAddress + `&tokenId=`+ _ticketId +`&size=100`);
        const orders = ticketsForSell.data.orders;
        const continuation = ticketsForSell.data.continuation;
        if (orders.length > 0) {
            tickets = orders;
            if (continuation) {
                newTickets = await GetBidsByTicket(_ticketId, ticketsForSell.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        }
    } else {
        // getSellOrdersByCollection from Rarible
        const ticketsForSell =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/order/orders/bids/byItem?contract=` + EnvConstant.contractAddress + `&tokenId=`+ _ticketId +`&size=100&continuation=` + _continuation);
        const orders = ticketsForSell.data.orders;
        const continuation = ticketsForSell.data.continuation;
        if (orders.length > 0) {
            tickets = orders;
            if (continuation) {
                newTickets = await GetTicketsForSell(_ticketId, ticketsForSell.continuation);
                if (newTickets.length > 0) {
                    tickets.push(newTickets);
                }
            }
            return tickets;
        } 
    }
    return [];
}

// Get details about ticket (eventId, eventName, ticketCategoryId, ticketCategoryName)
export async function GetDetailsAboutTicket(_ticketId)  {
    // Get eventId from informations about ticket
    const ticketQuery = `
        { tickets (where: { id: "0x` + Number(_ticketId).toString(16) + `" }) {
            eventId
            ticketCategoryId
        }} `;
    var dataFromSubGraph = await ApolloClientCustom.query({
        query: gql(ticketQuery)
    });
    var ticketDetail = dataFromSubGraph.data.tickets;
    if (ticketDetail.length > 0) {
        var eventId = ticketDetail[0].eventId;
        var ticketCategoryId = ticketDetail[0].ticketCategoryId;

        //Information about event
        const eventQuery = `
        { events(where: { id: "0x` + Number(eventId).toString(16) + `" }) {
            metadataIpfsCid
            creator
        }} `;

        var eventDataFromSubGraph = await ApolloClientCustom.query({
        query: gql(eventQuery)
        });
        var eventDetail = eventDataFromSubGraph.data.events;
        var metadataIpfsCid = eventDetail[0].metadataIpfsCid;
        var eventCreator = eventDetail[0].creator;
        const ipfsData = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCid)));
        const ipfsDataJSON = JSON.parse(uint8ArrayToString(ipfsData));

        //Information about ticket category
        const ticketCategoryQuery = `
        { ticketCategories(where: { id: "0x` + Number(ticketCategoryId).toString(16) + `" }) {
            metadataIpfsCid
        }} `;

        var ticketCategoryDataFromSubGraph = await ApolloClientCustom.query({
        query: gql(ticketCategoryQuery)
        });
        var ticketCategoryDetail = ticketCategoryDataFromSubGraph.data.ticketCategories;
        var metadataIpfsCidTicketCategory = ticketCategoryDetail[0].metadataIpfsCid;
        const ipfsDataTicketCategory = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCidTicketCategory)));
        const ipfsDataTicketCategoryJSON = JSON.parse(uint8ArrayToString(ipfsDataTicketCategory));
        return {
            eventId: eventId,
            eventName: ipfsDataJSON.name,
            eventCreator: eventCreator,
            ticketCategoryId: ticketCategoryId,
            ticketCategoryName: ipfsDataTicketCategoryJSON.categoryName
        }
    }
    return null;
}

// Get information about ticket from Rarible
export async function GetRaribleInformationAboutTicket(_ticketId) {
    const ticket = await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/` +  EnvConstant.contractAddress + `:` + _ticketId);
    return ticket.data;
}

// Create maker order 
export function CreateMakerOrder (maker, contract, tokenId, price ) {
    return {
      type: "RARIBLE_V2",
      maker: maker,
      make: {
        "assetType": {
          "assetClass": "ERC721",
          "contract": contract,
          "tokenId": tokenId,
        },
        "value": "1",
      },
      take: {
        "assetType": {
          "assetClass": "ETH",
        },
        "value": price,
      },
      data: {
        "dataType": "RARIBLE_V2_DATA_V1",
        "payouts": [],
        "originFees": [],
      },
      salt: `${random(1, 10000)}`,
    }
}

// Create bid order for sell
export function CreateBidOrderForCurrency (maker, contract, tokenId, price ) {
    return {
        type: "RARIBLE_V2",
        maker: maker,
        make: {
            "assetType": {
              "assetClass": "ERC20",
              "contract": EnvConstant.wethContractAddress,
            },
            "value": price,
          },
        take: {
          "assetType": {
            "assetClass": "ERC721",
            "contract": contract,
            "tokenId": tokenId,
          },
          "value": "1",
        },
        data: {
          "dataType": "RARIBLE_V2_DATA_V1",
          "payouts": [],
          "originFees": [],
        },
        salt: `${random(1, 10000)}`,
    }
}

// Create bid order for trade (one ticket to another)
export function CreateBidOrderForTrade (maker, contract, tokenId, tokenIdMake ) {
    return {
      type: "RARIBLE_V2",
      maker: maker,
      make: {
        "assetType": {
          "assetClass": "ERC721",
          "contract": contract,
          "tokenId": tokenIdMake,
        },
        "value": "1",
      },
      take: {
        "assetType": {
          "assetClass": "ERC721",
          "contract": contract,
          "tokenId": tokenId,
        },
        "value": "1",
      },
      data: {
        "dataType": "RARIBLE_V2_DATA_V1",
        "payouts": [],
        "originFees": [],
      },
      salt: `${random(1, 10000)}`,
    }
}

export function AssetType(assetClass, data) {
	return { assetClass, data }
}

export function Asset(assetClass, assetData, value) {
	return { assetType: AssetType(assetClass, assetData), value };
}

export function CreateCancelOrder (maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data ) {
    return { maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data };
}

export async function SignOrderMessage (
    struct,
    types,
    structType,
    domain,
    account
    ) {
    const data = CreateTypeData(
        domain,
        structType,
        struct,
        types,
    )
    
    const msgData = JSON.stringify(data);

    var signature = await Provider.send("eth_signTypedData_v4", [account, msgData]);
    return signature;
}

export async function SignTypedData(account, data) {
    const msgData = JSON.stringify(data);

    var signature = await Provider.send("eth_signTypedData_v4", [account, msgData]);
    return signature;
}

