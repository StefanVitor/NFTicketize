import { EnvConstant} from "./const";

module.exports = {
    getSellOrdersByItem : async (_ticketId, _continuation) => {
        //For sell and cancel sell button (do I have set this ticket for sell) 
        const ordersByItem = await axios.get(EnvConstant.raribleServer + "/protocol/v0.1/ethereum/order/orders/sell/byItem?contract=" + EnvConstant.contractAddress +"&tokenId=" + _ticketId + `&size=100`);

    }

    getSellOrdersByItem : async (_ticketId, _continuation) => {
        var tickets;
        var newTickets;
        if (_continuation == null) {
          const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100`);
          if (itemsByOwner.data.items.length > 0) {
            tickets = await getMyTicketsDataItems(itemsByOwner.data.items);
            newTickets = await getMyTickets(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
              tickets.push(newTickets);
            }
            return tickets;
          }
        } else {
          const itemsByOwner =  await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100&continuation=` + _continuation);
          if (itemsByOwner.data.items.length > 0) {
            tickets = await getMyTicketsDataItems(itemsByOwner.data.items);
            newTickets = await getMyTickets(_address, itemsByOwner.data.continuation);
            if (newTickets.length > 0) {
              tickets.push(newTickets);
            }
            return tickets;
          } 
        }
        return [];
      }
}