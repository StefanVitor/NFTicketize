import { EnvConstant} from "./const";
import axios from 'axios';

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

async function getMyTicketsPerEventFilter(_ticketsDataItems) {
    var data = [];
    for(var counter = 0; counter < _ticketsDataItems.length; counter++) {
        if (_ticketsDataItems[counter].contract.toLowerCase() === EnvConstant.contractAddress.toLowerCase()) {
            const tokensQuery = `
            { tickets (where: { id:: "` + _ticketsDataItems[counter].tokenId + `" }) {
                eventId
            }} `;
            var dataFromSubGraph = await client.query({
                query: gql(tokensQuery)
              });
            data.push(_ticketsDataItems[counter]);
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