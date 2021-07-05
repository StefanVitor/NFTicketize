import React from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useHistory } from "react-router-dom";
import Async from 'react-async';
import { ethers } from "ethers";
import { GetSellOrdersByItem, GetMyTickets, GetDetailsAboutTicket } from ".././UtilsData";
import { Provider} from ".././UtilsData";

// Styles template
const useStyles = makeStyles((theme)=>({
  root: {
    minWidth: 275
  }
}));

function MyTickets() {
  let history = useHistory();
  const classes = useStyles();

  //Get my tickets
  const getMyTickets = async () => {
    var data = [];
    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    // Get tickets from RaribleProtocol
    var ticketsDataItems = await GetMyTickets(address, null, null);
    if (address) {
      for(var counter = 0; counter < ticketsDataItems.length; counter++) {
        var obj = ticketsDataItems[counter];
        obj.buy_ticket_button = false;
        obj.date = new Date(Date.parse(obj.date)).toLocaleString();

        //Set sell button, cancel_sell button and resell_value field 
        const ordersByItem = await GetSellOrdersByItem(obj.tokenId, null);
        //If there is order in list, user could cancel sell(cancel that order), otherwise, user could sell (set order in list)
        if(ordersByItem.length > 0) {
          obj.resell_value_flag = true;
          var price = ordersByItem[0].take.value;
          obj.resell_value = ethers.utils.formatEther(price).toString();
          if (ordersByItem[0].makePriceUsd != null) {
            obj.price_in_usd = ordersByItem[0].makePriceUsd.toFixed(2);
          } else {
            obj.price_in_usd = 0;
          }
          obj.order = ordersByItem[0];
        }
        else {
          obj.resell_value_flag = false;
          obj.resell_value = 0;
          obj.price_in_usd = 0;
          obj.order = null;
        }

        var detailsAboutTicket = await GetDetailsAboutTicket(obj.tokenId);
        obj.event_id = parseInt(detailsAboutTicket.eventId);
        obj.event_name = detailsAboutTicket.eventName;
        obj.ticket_category_name = detailsAboutTicket.ticketCategoryName;

        data.push(obj);
      }
      return data;
    }
    return [];
  }

  const openEvent = (eventKey, eventName) => {
    history.push('/event_detail', {"eventKey": eventKey, "myEvent": "false", "eventName": eventName});
  }

  return (<div>
    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'left', alignItems:'center'}}>
        <h5>My tickets</h5>
      </div>
    </Box>
    <Async promiseFn={getMyTickets}>
      <Async.Loading>Loading...</Async.Loading>
      <Async.Fulfilled>
        {data => {
        return (
          <Grid container spacing={3} direction='column'>
            {data.map(ticket=> (
              <Grid item xs key={ticket.tokenId}>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        #Ticket ID {ticket.tokenId}
                        <br />
                        <br />
                        </Typography>
                        <Box component="div" visibility={ticket.resell_value_flag === true? "visible" : "hidden"}>
                          <Typography variant="body2" component="p" color="textSecondary">
                          #Price in ETH - {ticket.resell_value} ETH
                          <br />
                          </Typography>
                          <Typography variant="body2" component="p" color="textSecondary">
                          #Price in USD - {ticket.price_in_usd} USD
                          <br />
                          </Typography>
                        </Box>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Event name - {ticket.event_name}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Ticket category name - {ticket.ticket_category_name}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Created time {ticket.date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Button onClick={() => { openEvent(ticket.event_id, ticket.event_name)}} size="small" >Open event</Button>
                      </CardActions>
                    </Card>
                </Grid>
            ))}
          </Grid>
        )
      }}
      </Async.Fulfilled>
      <Async.Rejected>
        {error => `Something went wrong: ${error.message}`}
      </Async.Rejected>
    </Async>
  </div>);
}

export default MyTickets;