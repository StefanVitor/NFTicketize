import { EnvConstant} from "./const";
import axios from 'axios';
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';
import { ethers } from "ethers";

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

const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

async function getMyTicketsPerEventFilter(_ticketsDataItems, _eventId) {
    var data = [];
    for(var counter = 0; counter < _ticketsDataItems.length; counter++) {
        if (_ticketsDataItems[counter].contract.toLowerCase() === EnvConstant.contractAddress.toLowerCase()) {
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

// Get my tickets per event (token)
export async function GetMyTicketsPerEvent(_address, _continuation, _eventId)  {
    var tickets;
    var newTickets;
    if (_continuation == null) {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100`);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsPerEventFilter(itemsByOwner.data.items, _eventId);
        if (itemsByOwner.data.continuation) {
            newTickets = await GetMyTicketsPerEvent(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
                tickets.push(newTickets);
            }
        }
        return tickets;
      }
    } else {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100&continuation=` + _continuation);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsPerEventFilter(itemsByOwner.data.items, _eventId);
        if (itemsByOwner.data.continuation) {
            newTickets = await GetMyTicketsPerEvent(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
                tickets.push(newTickets);
            }
        }
        return tickets;
      } 
    }
    return [];
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