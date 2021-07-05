import { EnvConstant} from "./const";

module.exports = {
    getSellOrdersByItem : async (ticketId) => {
        //For sell and cancel sell button (do I have set this ticket for sell) 
        const ordersByItem = await axios.get(EnvConstant.raribleServer + "/protocol/v0.1/ethereum/order/orders/sell/byItem?contract=" + EnvConstant.contractAddress +"&tokenId=" + ticketId+ `&size=100`);

    }
}