import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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
import LoadingOverlay from "react-loading-overlay";
import { useHistory } from "react-router-dom";
import { ethers } from "ethers";
import { gql } from '@apollo/client';
import { SnackbarProvider, useSnackbar } from 'notistack';
import axios from 'axios';
import { GetSellOrdersByItem, GetRaribleInformationAboutTicket, GetMyTickets, GetBidsByTicket, GetDetailsAboutTicket, GetTicketsForBid, GetTicketsForSell, CreateCancelOrder, SignOrderMessage, StringToBoolean, PrepareTx, CreateCancelOrderOld } from ".././UtilsData";
import { CreateMakerOrder, CreateBidOrderForCurrency, CreateBidOrderForTrade} from ".././UtilsData";
import { Asset} from ".././UtilsData";
import { ApolloClientCustom, Provider, ERC721, enc, ETH, ZERO, ORDER_DATA_V1} from ".././UtilsData";

// Styles template
const useStyles = makeStyles((theme)=>({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  labelFormControl: {
    minWidth: 160,
  },
  labelFormControlFull: {
    minWidth: 360,
  },
}));

const NFTicketizeContractArt = require( "../contracts/NFTicketize.json");
const ExchangeV2CoreArt = require( "../contracts/rarible/ExchangeV2Core.json");

const TicketsTypesEnum = {
	MY_TICKETS: "my_tickets",
  FOR_SELL: "for_sell",
	FOR_BID: "for_bid"
};

function TicketMarketDetail({onReloadList, onSetOverlay, onSetSnackBarMessage, eventKey}) {  
  let history = useHistory();

  const [buyTicketDialogOpen, setBuyTicketDialogOpen] = React.useState(false);
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const [cancelSellDialogOpen, setCancelSellDialogOpen] = React.useState(false);
  const [forBidDialogOpen, setForBidDialogOpen] = React.useState(false);
  const [cancelForBidDialogOpen, setCancelForBidDialogOpen] = React.useState(false);
  const [bidDialogOpen, setBidDialogOpen] = React.useState(false);
  const [tokenForDialog, setTokenForDialog] =  React.useState(-1);

  const [ticketsTypes, setTicketTypes] = React.useState("my_tickets");
  const [orderForDialog, setOrderForDialog] = React.useState(null);

  const getTickets = async () => {
    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    var tickets = [];
    if (ticketsTypes === TicketsTypesEnum.MY_TICKETS) {
      tickets = await getMyTickets(address, null);
    } else if (ticketsTypes === TicketsTypesEnum.FOR_SELL) {
      tickets = await getTicketsForSell(address, null);
    } else if (ticketsTypes === TicketsTypesEnum.FOR_BID) {
      tickets = await getTicketsForBid(address);
    }

    for(var counter = 0; counter < tickets.length; counter++) {
      var ticketDetailInformation = await GetDetailsAboutTicket(tickets[counter].tokenId);
      if (ticketDetailInformation != null) {
        if (eventKey == null) {
          tickets[counter].open_event_button = true;
          tickets[counter].event_id = ticketDetailInformation.eventId;
          tickets[counter].event_name = ticketDetailInformation.eventName;
          if (ticketDetailInformation.eventCreator.toLowerCase() === address.toLowerCase()) {
            tickets[counter].my_event = true;
          } else {
            tickets[counter].my_event = false;
          }
          tickets[counter].ticket_detail = ticketDetailInformation.eventName + " - " + ticketDetailInformation.ticketCategoryName;
        } else {
          tickets[counter].open_event_button = false;
          tickets[counter].event_id = -1;
          tickets[counter].event_name = "";
          tickets[counter].my_event = false;
          tickets[counter].ticket_detail = ticketDetailInformation.ticketCategoryName;
        }
      }
    }

    return tickets;
  }

  //Get my tickets
  const getMyTickets = async (_address, _continuation) => {
    var data = [];
    var ticketsDataItems = await GetMyTickets(_address, null, eventKey);
    for(var counter = 0; counter < ticketsDataItems.length; counter++) {
      var obj = ticketsDataItems[counter];
      obj.buy_ticket_button = false;
      obj.date = new Date(Date.parse(obj.date)).toLocaleString();

      //Set sell and cancel_sell buttons and resell_value field 
      const ordersByItem = await GetSellOrdersByItem(obj.tokenId, null);
      //If there is order in list, user could cancel sell(cancel that order), otherwise, user could sell (set order in list)
      if(ordersByItem.length > 0) {
        obj.sell_button = false;
        obj.cancel_sell_button = true;
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
        obj.sell_button = true;
        obj.cancel_sell_button = false;
        obj.resell_value_flag = false;
        obj.resell_value = 0;
        obj.price_in_usd = 0;
        obj.order = null;
      }
      
      const ticketQuery = ` {
        tickets(where: { id: "0x` + Number(obj.tokenId).toString(16) + `" }) {
          forBid
        }
      }`;
      var dataFromSubGraph = await ApolloClientCustom.query({
          query: gql(ticketQuery)
      });
      var ticketsData = dataFromSubGraph.data.tickets;
      if (parseInt(ticketsData[0].forBid) === 0) {
        obj.for_bid = true;
        obj.cancel_for_bid = false;
      } else {
        obj.for_bid = false;
        obj.cancel_for_bid = true;
      }
      obj.bid = false;

      data.push(obj);
    }
    return data;
  }

  //Get tickets for sell
  const getTicketsForSell = async (_address, _continuation) => {
    var data = [];
    var ticketsDataItems = await GetTicketsForSell(_address, null, eventKey);
    for(var counter = 0; counter < ticketsDataItems.length; counter++) {
      var obj = ticketsDataItems[counter];
      obj.tokenId = ticketsDataItems[counter].make.assetType.tokenId;
      //Set buttons
      obj.buy_ticket_button = true;
      obj.date = new Date(Date.parse(obj.lastUpdateAt)).toLocaleString();
      obj.sell_button = false;
      obj.cancel_sell_button = false;
      obj.resell_value_flag = true;
      
      var price = obj.take.value;
      obj.resell_value = ethers.utils.formatEther(price).toString();
      if (obj.makePriceUsd != null) {
        obj.price_in_usd = obj.makePriceUsd.toFixed(2);
      } else {
        obj.price_in_usd = 0;
      }

      obj.order = obj;
      obj.for_bid = false;
      obj.cancel_for_bid = false;
      obj.bid = false;
      data.push(obj);
    }
    return data;
  }
  
  //Get tickets for bid
  const getTicketsForBid = async (_address) => {

    var ticketsForBid = await GetTicketsForBid(_address, eventKey);
    for(var counter = 0; counter < ticketsForBid.length; counter++) {
      ticketsForBid[counter].buy_ticket_button = false;
      ticketsForBid[counter].date = new Date(Date.parse(ticketsForBid[counter].date)).toLocaleString();
      ticketsForBid[counter].sell_button = false;
      ticketsForBid[counter].cancel_sell_button = false;

      ticketsForBid[counter].resell_value_flag = false;
      ticketsForBid[counter].resell_value = 0;
      ticketsForBid[counter].price_in_usd = 0;
      ticketsForBid[counter].bid = true;
    }
    return ticketsForBid;
  }

  //Get tickets for bid
  const getBids = async ({ticket}) => {
    if (ticket !== "-1") {
      var bids = await GetBidsByTicket(ticket, null);
      const signer = Provider.getSigner()
      const address = await signer.getAddress();
      var resultBids = [];
      for(var counter = 0; counter < bids.length; counter++) {
        var resultBid = {};
        var make = bids[counter].make;
        resultBid.hash = bids[counter].hash;
        resultBid.type = make.assetType.assetClass;
        resultBid.value = make.value;
        resultBid.date = new Date(Date.parse(bids[counter].createdAt)).toLocaleString(); 
        if (make.assetType.assetClass === "ERC721") {
          var detailsAboutTicket = await GetDetailsAboutTicket(make.assetType.tokenId);
          resultBid.description = detailsAboutTicket.eventName + " - " + detailsAboutTicket.ticketCategoryName + " ID#" + make.assetType.tokenId;
        }

        //Set accept bid button
        const ticketRarible = await GetRaribleInformationAboutTicket(ticket);
        if (ticketRarible.owners[0].toLowerCase() ===  address.toLowerCase()) {
          resultBid.accept_bid = true;
        } else {
          resultBid.accept_bid = false;
        }

        //Set cancel bid button
        if (bids[counter].maker.toLowerCase() === address.toLowerCase()) {
          resultBid.cancel_bid = true;
        } else {
          resultBid.cancel_bid = false;
        }
        resultBids.push(resultBid);
      }
      return resultBids;
    }
    return [];
  }

  // Dialog for buy ticket button - open
  const buyTicketDialogHandleOpen = (tokenKey, order) =>  {
    setTokenForDialog(tokenKey);
    setOrderForDialog(order);
    setBuyTicketDialogOpen(true);
  }

  // Dialog for sell button - close
  const buyTicketDialogHandleClose = () => {
    setTokenForDialog(-1)
    setOrderForDialog(null);
    setBuyTicketDialogOpen(false);
  };
  
  // Dialog for buy ticket button - open
  const sellDialogHandleOpen = (tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setSellDialogOpen(true);
  }

  // Dialog for set ticket for bid - open
  const forBidDialogHandleOpen = (tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setForBidDialogOpen(true);
  }

  // Dialog for set ticket for bid - open
  const cancelForBidDialogHandleOpen = (tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setCancelForBidDialogOpen(true);
  }

  // Dialog for set ticket for bid - open
  const bidDialogHandleOpen = (tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setBidDialogOpen(true);
  }

  // Dialog for buy ticket button - on buy click
  const buyTicketDialogHandleBuy = async() => {
    const signer = Provider.getSigner();
    const maker = await signer.getAddress();
    const preparedTx = await PrepareTx(orderForDialog.hash, maker, 1)
    const priceForSellWei = ethers.utils.parseEther(orderForDialog.resell_value);
    const tx = {
      from: maker,
      data: preparedTx.transaction.data,
      to: preparedTx.transaction.to,
      value: priceForSellWei._hex
    }
    console.log("sending tx", tx);
    //const sendTransactionResponse = await signer.sendTransaction(tx);

    const sendTransactionResponse = await Provider.send("eth_sendTransaction", [tx]);
    console.log(sendTransactionResponse);
  }

  // Dialog for cancel sell - open
  const cancelSellDialogHandleOpen = (tokenKey, order) =>  {
    setTokenForDialog(tokenKey);
    setOrderForDialog(order);
    setCancelSellDialogOpen(true);
  }

  const handleChangeTicketsTypes = (ticketType) => {
    setTicketTypes(ticketType);
  };

  const acceptBidOffer = async(bidHash) => {

  }

  const cancelBidOffer = async(bidHash) => {

  }

  const openEventHandleOpen = async(eventKey, myEvent, eventName) => {
    history.push('/event_detail', {"eventKey": eventKey, "myEvent": myEvent.toString(), "eventName": eventName});
  }

  const classes = useStyles();

  return (<div>

    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'left', alignItems:'center', padding:"5"}}>
        <h5>Ticket market</h5>
      </div>

      <Box pt={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Tickets types</FormLabel>
          <RadioGroup aria-label="Tickets types" row  name="ti" value={ticketsTypes} onChange={ event => handleChangeTicketsTypes(event.target.value)}>
            <FormControlLabel value={TicketsTypesEnum.MY_TICKETS} control={<Radio />} label="My tickets" />
            <FormControlLabel value={TicketsTypesEnum.FOR_SELL} control={<Radio />} label="For sell" />
            <FormControlLabel value={TicketsTypesEnum.FOR_BID} control={<Radio />} label="For bid" />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
   
    <Async promiseFn={getTickets}>
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
                        <Typography variant="body2" component="p" color="textSecondary">
                          #Ticket detail - {ticket.ticket_detail}
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
                        #Created time {ticket.date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Box component="div" visibility={ticket.open_event_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { openEventHandleOpen(ticket.event_id, ticket.my_event, ticket.event_name)}} size="small" >Open event</Button>
                          </Box>
                          <Box component="div" visibility={ticket.buy_ticket_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyTicketDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={ticket.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(ticket.tokenId)}} size="small" >For sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Cancel sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.for_bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { forBidDialogHandleOpen(ticket.tokenId)}} size="small" >For bid</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_for_bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelForBidDialogHandleOpen(ticket.tokenId)}} size="small" >Cancel for bid</Button>
                          </Box>
                          <Box component="div" visibility={ticket.bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { bidDialogHandleOpen(ticket.tokenId)}} size="small" >Bid</Button>
                          </Box>
                        </CardActions>


                        <Box component="div" visibility={(ticket.bid === true || ticket.cancel_for_bid === true)? "visible" : "hidden"}>
                        <Accordion>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                          >
                          <Typography className={classes.heading}>Offers</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Async promiseFn={getBids} ticket={ticket.tokenId}>
                              <Async.Loading>Loading...</Async.Loading>
                              <Async.Fulfilled>
                                {bidsData => {
                                return (
                                  <Grid container spacing={3} direction='column'>
                                    {bidsData.map(bid=> (
                                      <Grid item xs key={bid.hash}>
                                            <Card className={classes.root}>
                                              <CardContent>
                                                <Typography variant="body2" component="p" color="textSecondary">
                                                  #Bid type - {bid.type === "ERC721" ? "Ticket": "Currency"}
                                                <br />
                                                </Typography>
                                                <Box component="div" visibility={bid.type === "ERC721"? "visible" : "hidden"}>
                                                  <Typography variant="body2" component="p" color="textSecondary">
                                                    #Bid description - {bid.description}
                                                  <br />
                                                  </Typography>
                                                </Box>
                                                <Box component="div" visibility={bid.type === "ETH"? "visible" : "hidden"}>
                                                  <Typography variant="body2" component="p" color="textSecondary">
                                                    #Bid value - {bid.value}
                                                  <br />
                                                  </Typography>
                                                </Box>
                                                <Typography variant="body2" component="p" color="textSecondary">
                                                #Created time {bid.date}
                                                <br />
                                                </Typography>
                                              </CardContent>
                                              <CardActions>
                                                  <Box component="div" visibility={bid.accept_bid === true? "visible" : "hidden"}>
                                                    <Button onClick={() => { acceptBidOffer(bid.hash)}} size="small">Accept bid</Button>
                                                  </Box>
                                                  <Box component="div" visibility={bid.cancel_bid === true? "visible" : "hidden"}>
                                                    <Button onClick={() => { cancelBidOffer(bid.hash)}} size="small">Cancel bid</Button>
                                                  </Box>
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

                          </AccordionDetails>
                        </Accordion>
                        </Box>
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

    <Dialog open={buyTicketDialogOpen} onClose={() => buyTicketDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Buy ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to buy ticket ID "{tokenForDialog}"?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => buyTicketDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => buyTicketDialogHandleBuy()} color="primary">
          Buy
        </Button>
      </DialogActions>
    </Dialog>

    <ForSellDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} onSetSnackBarMessage={onSetSnackBarMessage}
      sellDialogOpen={sellDialogOpen} setSellDialogOpen={setSellDialogOpen} tokenForDialog={tokenForDialog}>
    </ForSellDialog>

    <CancelForSellDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} onSetSnackBarMessage={onSetSnackBarMessage}
      cancelSellDialogOpen={cancelSellDialogOpen} setCancelSellDialogOpen={setCancelSellDialogOpen} tokenForDialog={tokenForDialog} 
      orderForDialog={orderForDialog}>
    </CancelForSellDialog>

    <ForBidDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} onSetSnackBarMessage={onSetSnackBarMessage}
      forBidDialogOpen={forBidDialogOpen} setForBidDialogOpen={setForBidDialogOpen} tokenForDialog={tokenForDialog}>
    </ForBidDialog>

    <CancelForBidDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} onSetSnackBarMessage={onSetSnackBarMessage}
      cancelForBidDialogOpen={cancelForBidDialogOpen} setCancelForBidDialogOpen={setCancelForBidDialogOpen} 
      tokenForDialog={tokenForDialog}>
    </CancelForBidDialog>

    <BidDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay}
      bidDialogOpen={bidDialogOpen} setBidDialogOpen={setBidDialogOpen} 
      tokenForDialog={tokenForDialog}>
    </BidDialog>
  </div>);
}


function ForSellDialog({onReloadList, onSetOverlay, onSetSnackBarMessage,
    sellDialogOpen, setSellDialogOpen, tokenForDialog}) {
  
  const [priceForSell, setPriceForSell] = React.useState("");
  const [priceForSellValidation, setPriceForSellValidation] = React.useState(false);

  // Dialog for sell button - close
  const sellDialogHandleClose = () => {
    setSellDialogOpen(false);
  };


  // Dialog for sell button - on sell click
  const sellDialogHandleSell  = async() => {

    if (priceForSell <= 0) {
      setPriceForSellValidation(true);
      return;
    }

    setSellDialogOpen(false);
    onSetOverlay(true);

    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    const priceForSellWei = ethers.utils.parseEther(priceForSell);

    try {
      const form = CreateMakerOrder(address, EnvConstant.contractAddress, tokenForDialog, priceForSellWei.toString());
      const orderDataJSON = await axios.post(EnvConstant.raribleServer + "/protocol/v0.1/ethereum/order/encoder/order", form);
      const msg =orderDataJSON.data.signMessage;
      const signature = await SignOrderMessage(
        msg.struct, msg.types, msg.structType, msg.domain, form.maker
      )

      form.signature = signature;
      await axios.post(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/order/orders", form);

      onSetSnackBarMessage("Ticket with ID" + tokenForDialog + " is successfully set for sell");
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (error) {
      onSetSnackBarMessage(error.message, "error");
      onSetOverlay(false);
    }
  }

  return (
    <Dialog open={sellDialogOpen} onClose={() => sellDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">For sell ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to set ticket ID "{tokenForDialog} for sell"?
        </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="project_name"
            label="Price for sell"
            required
            fullWidth
            type="Number"
            onChange={event => {
              setPriceForSell(event.target.value);
            }}
            error={priceForSellValidation}
          />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => sellDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => sellDialogHandleSell()} color="primary">
          For sell
        </Button>
      </DialogActions>
    </Dialog>
  )
}


function CancelForSellDialog({onReloadList, onSetOverlay, onSetSnackBarMessage,
  cancelSellDialogOpen, setCancelSellDialogOpen, tokenForDialog, orderForDialog}) {

  // Dialog for cancel sell - close
  const cancelSellDialogHandleClose = () => {
    setCancelSellDialogOpen(false);
  };

  // Dialog for cancel sell - on cancel sell 
  const cancelSellDialogHandleSell = async() => {
    setCancelSellDialogOpen(false);
    if (orderForDialog) {
      onSetOverlay(true);
      //Call RaribleExchange contract - cancel function
      const raribleExchangeContract = new ethers.Contract(EnvConstant.raribleExchangeContractAddress, ExchangeV2CoreArt.abi, Provider);
      const signer = Provider.getSigner()
      const raribleExchangeContractWithSigner = raribleExchangeContract.connect(signer);
      try {
        /*const cancelOrder = CreateCancelOrder(signer.getAddress(), 
          Asset(ERC20, enc(t1.address), makeAmount), ZERO, Asset(ERC20, enc(t2.address), takeAmount), 1, 0, 0, ORDER_DATA_V1, encDataLeft)*/
        const makerAddress = await signer.getAddress();
        const cancelOrder = CreateCancelOrder(makerAddress, 
          Asset(ERC721, enc(orderForDialog.make.assetType.contract), orderForDialog.make.value), 
          ZERO, 
          Asset(ETH, enc(ZERO), orderForDialog.take.value), 
          orderForDialog.salt, 
          0, 
          0, 
          ORDER_DATA_V1, 
          0);
        //const priceForSellWei = ethers.utils.parseEther("0.05");
        //const cancelOrderOld = CreateCancelOrderOld(makerAddress, EnvConstant.contractAddress, tokenForDialog, priceForSellWei.toString());
        /*const transactionDetail = await raribleExchangeContractWithSigner.cancel(cancelOrder, {from: makerAddress});
        console.log(transactionDetail);
        const transactionConfirm = await Provider.waitForTransaction(transactionDetail.hash);
        console.log(transactionConfirm);*/

        const signer = Provider.getSigner();
        const maker = await signer.getAddress();
        const preparedTx = await PrepareTx(orderForDialog.hash, maker, 1)
        const priceForSellWei = ethers.utils.parseEther(orderForDialog.resell_value);
        const tx = {
          from: maker,
          data: preparedTx.transaction.data,
          to: preparedTx.transaction.to,
          value: priceForSellWei._hex
        }
        const sendTransactionResponse = await Provider.send("eth_sendTransaction", [tx]);
        console.log(sendTransactionResponse);
        //const transactionDetail = await raribleExchangeContractWithSigner.cancel(result.data.data, {from: makerAddress});
        //console.log(transactionDetail);
        onSetSnackBarMessage("Ticket is success cancel for sell", "success");
        onReloadList(true);
        onSetOverlay(false);
      } catch (error) {
        onSetSnackBarMessage(error, "error");
        onSetOverlay(false);
      }
    }
  }

  return (
    <Dialog open={cancelSellDialogOpen} onClose={() => cancelSellDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Cancel sell ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to cancel ticket ID "{tokenForDialog}"?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => cancelSellDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => cancelSellDialogHandleSell()} color="primary">
          Cancel Sell
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function ForBidDialog({onReloadList, onSetOverlay, onSetSnackBarMessage, forBidDialogOpen, setForBidDialogOpen, tokenForDialog}) {

  // Dialog for bid button - close
  const forBidDialogHandleClose = () => {
    setForBidDialogOpen(false);
  };

  // Dialog for bid button - set bid
  const forBidDialogHandleBid = async() => {
    onSetOverlay(true);
    setForBidDialogOpen(false);

    const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, Provider);

    //Insert into smart contract
    const signer = Provider.getSigner()
    const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
    try {
      const transactionDetail = await nftTicketizeContractWithSigner.setTicketForBid(tokenForDialog, 1);

      await Provider.waitForTransaction(transactionDetail.hash);

      onSetSnackBarMessage("Ticket is set for bid", "success");
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (error) {
      onSetSnackBarMessage(error.message, "error");
      onSetOverlay(false);
    }
  };

  return (<Dialog open={forBidDialogOpen} onClose={() => forBidDialogHandleClose()} aria-labelledby="form-dialog-title">
    <DialogTitle id="form-dialog-title">Set ticket for bid</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        Do you want to set ticket ID "{tokenForDialog}" for bid?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => forBidDialogHandleClose()} color="primary">
        Cancel
      </Button>
      <Button onClick={() => forBidDialogHandleBid()} color="primary">
        Set for bid
      </Button>
    </DialogActions>
  </Dialog>);
}

  function CancelForBidDialog({onReloadList, onSetOverlay, onSetSnackBarMessage, cancelForBidDialogOpen, setCancelForBidDialogOpen, tokenForDialog}) {

    // Dialog for bid button - close
    const forBidDialogHandleClose = () => {
      setCancelForBidDialogOpen(false);
    };
  
    // Dialog for bid button - set bid
    const forBidDialogHandleBid = async() => {
      onSetOverlay(true);
      setCancelForBidDialogOpen(false);
  
      const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, Provider);
  
      //Insert into smart contract
      const signer = Provider.getSigner()
      const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
      try {
        const transactionDetail = await nftTicketizeContractWithSigner.setTicketForBid(tokenForDialog, 0);
  
        await Provider.waitForTransaction(transactionDetail.hash);
  
        onSetSnackBarMessage("Ticket is set for bid", "success");
        onReloadList(true);
        onSetOverlay(false);
      }
      catch (error) {
        onSetSnackBarMessage(error.message, "error");
        onSetOverlay(false);
      }
    };

  return (<Dialog open={cancelForBidDialogOpen} onClose={() => forBidDialogHandleClose()} aria-labelledby="form-dialog-title">
    <DialogTitle id="form-dialog-title">Cancel set ticket for bid</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        Do you want to cancel set ticket ID "{tokenForDialog}" for bid?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => forBidDialogHandleClose()} color="primary">
        Cancel
      </Button>
      <Button onClick={() => forBidDialogHandleBid()} color="primary">
        Cancel set for bid
      </Button>
    </DialogActions>
  </Dialog>);
}


function BidDialog({onReloadList, onSetOverlay, bidDialogOpen, setBidDialogOpen, tokenForDialog}) {
  
  const [bidType, setBidType] = React.useState(0);
  const [priceForBid, setPriceForBid] = React.useState(0);
  const [priceForBidValidation, setPriceForBidValidation] = React.useState(false);
  const [ticketForTradeOffer, setTicketForTradeOffer] = React.useState(-1);
  const [myTickets, setMyTickets] = React.useState([]);

  // Dialog for buy button - close
  const bidDialogHandleClose = () => {
    setBidDialogOpen(false);
  };

  useEffect(() => {
    const getMyTickets = async() =>  {
      var innerTickets = [];
      const signer = Provider.getSigner()
      const address = await signer.getAddress();
      const tickets = await GetMyTickets(address, null, null);
      for(var counter = 0; counter < tickets.length; counter++) {
        var detailsAboutTicket = await GetDetailsAboutTicket(tickets[counter].tokenId);
        if (detailsAboutTicket != null) {
          innerTickets.push({
            id: tickets[counter].tokenId,
            value: detailsAboutTicket.eventName + " - " + detailsAboutTicket.ticketCategoryName + " ID#" + tickets[counter].tokenId
          });
        } else {
          innerTickets.push({
            id: tickets[counter].tokenId,
            value: "ID#" + tickets[counter].tokenId
          });
        }
      }
      setMyTickets(innerTickets);
    }
    getMyTickets();
  }, []);

  // Dialog for buy button - buy
  const bidDialogHandleBid = async() => {
    var order = null;
    if (bidType === 0) {
      if (priceForBid == null || priceForBid === 0) {
        setPriceForBidValidation(true);
        return;
      }

      setBidDialogOpen(false);
      onSetOverlay(true);

      const priceForBidWei = ethers.utils.parseEther(priceForBid);
      const signer = Provider.getSigner()
      const address = await signer.getAddress();
      order = CreateBidOrderForCurrency(address, EnvConstant.contractAddress, tokenForDialog, priceForBidWei.toString());
    } else if (bidType === 1) {
      if (ticketForTradeOffer == null || ticketForTradeOffer === -1) {
          return;
      }

      setBidDialogOpen(false);
      onSetOverlay(true);

      const signer = Provider.getSigner()
      const address = await signer.getAddress();
      order = CreateBidOrderForTrade(address, EnvConstant.contractAddress, tokenForDialog, ticketForTradeOffer);
    }

    if (order !== null) {
      const orderDataJSON = await axios.post(EnvConstant.raribleServer + "/protocol/v0.1/ethereum/order/encoder/order", order);
      const msg =orderDataJSON.data.signMessage;
      const signature = await SignOrderMessage(
        msg.struct, msg.types, msg.structType, msg.domain, order.maker
      )

      order.signature = signature;
      await axios.post(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/order/orders", order);
    }

    onReloadList(true);
    onSetOverlay(false);
  }

  return (<Dialog open={bidDialogOpen} onClose={() => bidDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Bid for ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to bid ticket for ticket with ID "{tokenForDialog}"?
        </DialogContentText>
        <FormControl component="fieldset">
          <FormLabel component="legend">Bid type</FormLabel>
          <RadioGroup aria-label="Tickets types" row  name="ti" value={bidType} onChange={ event => setBidType(parseInt(event.target.value))}>
            <FormControlLabel value={0} control={<Radio />} label="For currency" />
            <FormControlLabel value={1} control={<Radio />} label="Trade" />
          </RadioGroup>
        </FormControl>
        <Box component="div" visibility={bidType === 0 ? "visible" : "hidden"}>
          <TextField
              
              margin="dense"
              id="project_name"
              label="Price for sell"
              required
              fullWidth
              type="Number"
              onChange={event => {
                setPriceForBid(event.target.value);
              }}
              error={priceForBidValidation}
            />
        </Box>
        <Box component="div" visibility={bidType === 1 ? "visible" : "hidden"}>
          <FormControl fullWidth>
            <InputLabel id="select-tier-time-limit">Set ticket for trade offer</InputLabel>
            <Select
              labelId="select-tier-time-limit"
              id="Ticket for trade offer"
              value={ticketForTradeOffer}
              onChange={event => {
                setTicketForTradeOffer(event.target.value);
              }}>
              {myTickets.map((ticket, index) =>
                <MenuItem key={ticket.id} value={ticket.id}>
                  {ticket.value}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => bidDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => bidDialogHandleBid()} color="primary">
          Set bid
        </Button>
      </DialogActions>
    </Dialog>);
}


function TicketMarketInner({eventKey}) {
  const { enqueueSnackbar } = useSnackbar();
  const [reloadList, setReloadList] = React.useState(false);
  const [isActiveOverlay, setIsActiveOverlay] = React.useState(false);

  const reloadListFunc = () => {
    setReloadList(true);
  }

  const setOverlayFunc = (value) => {
    setIsActiveOverlay(value);
  }

  // Set Snackbar message
  const setSnackBarMessage = (message, variant) => {
    // variant could be success, error, warning, info, or default
    enqueueSnackbar(message, { variant, persist: false });
  };

  useEffect(() => {
    setReloadList(false);
  }, [reloadList]);

  return (
    <LoadingOverlay
      active={isActiveOverlay}
      spinner
      text='Waiting for response...'
      styles={{
        wrapper: {
          overflow: isActiveOverlay ? 'hidden' : 'visible'
        }
      }}
    >
      <div>
        <TicketMarketDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} onSetSnackBarMessage = {setSnackBarMessage} eventKey={eventKey}>
        </TicketMarketDetail>
      </div>
    </LoadingOverlay>
  );
}

export default function TicketMarket(props) {
  const eventKey = props.eventKey;
  return (
    <SnackbarProvider maxSnack={3}>
      <TicketMarketInner eventKey = {eventKey} />
    </SnackbarProvider>
  );
}