import { EnvConstant} from "./const";
import axios from 'axios';
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';

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

// TheGraph initialization
export const ApolloClientCustom = new ApolloClient({
    uri: EnvConstant.theGraphAPIUrl,
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions
});

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

async function getMyTicketsPerEventFilter(_ticketsDataItems, _eventId) {
    var data = [];
    for(var counter = 0; counter < _ticketsDataItems.length; counter++) {
        if (_ticketsDataItems[counter].contract.toLowerCase() === EnvConstant.contractAddress.toLowerCase()) {
            const tokensQuery = `
            { tickets (where: { id:: "` + _ticketsDataItems[counter].tokenId + `" }) {
                eventId
            }} `;
            var dataFromSubGraph = await ApolloClientCustom.query({
                query: gql(tokensQuery)
            });
            var tickets = dataFromSubGraph.data.tickets;
            if (tickets[0].eventId === _eventId) {
                data.push(_ticketsDataItems[counter]);
            }
        }
    }
}

// Get my tickets per event (token)
export async function GetMyTicketsPerEvent(_address, _continuation, _eventId)  {
    var tickets;
    var newTickets;
    if (_continuation == null) {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100`);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsPerEventFilter(itemsByOwner.data.items, _eventId);
        newTickets = await getMyTickets(_address, itemsByOwner.data.continuation);
        if (newTickets.length > 0) {
          tickets.push(newTickets);
        }
        return tickets;
      }
    } else {
      const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100&continuation=` + _continuation);
      if (itemsByOwner.data.items.length > 0) {
        tickets = await getMyTicketsPerEventFilter(itemsByOwner.data.items, _eventId);
        newTickets = await getMyTickets(_address, itemsByOwner.data.continuation);
        if (newTickets.length > 0) {
          tickets.push(newTickets);
        }
        return tickets;
      } 
    }
    return [];
}