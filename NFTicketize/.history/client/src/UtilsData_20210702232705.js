import { EnvConstant} from "./const";
import axios from 'axios';
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';
import { ethers } from "ethers";


const Web3EthAbi = require('web3-eth-abi');
const ethUtil = require('ethereumjs-util');

const defaultOptions: DefaultOptions = {
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
        if (_ticketsDataItems[counter].maker.toLowerCase() !== _address.toLowerCase()) {
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

function createTypeData (domainData, primaryType, message, types) {
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
    var tickets = [];
    var newTickets;
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
            
        }
    } 
    return tickets;
}


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
    const data = createTypeData(
        domain,
        structType,
        struct,
        types,
    )
    
    const msgData = JSON.stringify(data);

    var signature = await Provider.send("eth_signTypedData_v4", [account, msgData]);
    return signature;
}

