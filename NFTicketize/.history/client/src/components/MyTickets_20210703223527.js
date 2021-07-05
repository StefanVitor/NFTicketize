import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { EnvConstant} from ".././const";
import Async from 'react-async';
import { useLocation } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { ethers } from "ethers";
import { gql } from '@apollo/client';
import { SnackbarProvider, useSnackbar } from 'notistack';
import axios from 'axios';
import { GetSellOrdersByItem, GetRaribleInformationAboutTicket, GetMyTickets, GetBidsByTicket, GetDetailsAboutTicket, GetTicketsForBid, GetTicketsForSell, CreateCancelOrder, SignOrderMessage, StringToBoolean, PrepareTx } from ".././UtilsData";
import { CreateMakerOrder, CreateBidOrderForCurrency, CreateBidOrderForTrade} from ".././UtilsData";
import { Asset, AssetType} from ".././UtilsData";
import { ApolloClientCustom, Provider, ERC721, enc, ETH, ZERO, ORDER_DATA_V1} from ".././UtilsData";

// Styles template
const useStyles = makeStyles((theme)=>({
  root: {
    minWidth: 275
  }
}));

function MyTickets() {

  const classes = useStyles();

  //Get my tickets
  const getMyTickets = async () => {
    var data = [];
    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    var ticketsDataItems = await GetMyTickets(_address, null, null);
    for(var counter = 0; counter < ticketsDataItems.length; counter++) {
      var obj = ticketsDataItems[counter];
      obj.buy_ticket_button = false;
      obj.date = new Date(Date.parse(obj.date)).toLocaleString();

      //Set sell and cancel_sell buttons and resell_value field 
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
      obj.event_name = detailsAboutTicket.eventName;
      obj.ticket_category_name = detailsAboutTicket.ticketCategoryName;

      data.push(obj);
    }
    return data;
  }

  const openEvent = (eventId) => {

  }

  return (<div>
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
                        #Event name {ticket.event_name}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Ticket category name {ticket.ticket_category_name}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Created time {ticket.date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Button onClick={() => { openEvent(ticket.tokenId)}} size="small" >Open event</Button>
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