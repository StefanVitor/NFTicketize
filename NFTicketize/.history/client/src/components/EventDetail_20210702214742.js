import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
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
import { GetSellOrdersByItem, GetMyTickets, GetTicketsForSell, CreateMakerOrder, CreateCancelOrder, SignOrderMessage, StringToBoolean, PrepareTx } from ".././UtilsData";
import { Asset, AssetType} from ".././UtilsData";
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
}));

const NFTicketizeContractArt = require( "../contracts/NFTicketize.json");
const ExchangeV2CoreArt = require( "../contracts/rarible/ExchangeV2Core.json");

const uint8ArrayToString = require('uint8arrays/to-string');
const uint8ArrayConcat = require('uint8arrays/concat');
const all = require('it-all');

const TicketsTypesEnum = {
	MY_TICKETS: "my_tickets",
  FOR_SELL: "for_sell",
	FOR_OFFER: "for_offer"
};

function TicketCategoryDetail({onReloadList, onSetOverlay, ipfs}) {  
 
  const [buyDialogOpen, setBuyDialogOpen] = React.useState(false);
  const [buyTicketDialogOpen, setBuyTicketDialogOpen] = React.useState(false);
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const [cancelSellDialogOpen, setCancelSellDialogOpen] = React.useState(false);
  
  const [tokenForDialog, setTokenForDialog] =  React.useState(-1);

  const [priceForSell, setPriceForSell] = React.useState("");
  const [priceForSellValidation, setPriceForSellValidation] = React.useState(false);
  const [ticketsTypes, setTicketTypes] = React.useState("my_tickets");
  const [orderForDialog, setOrderForDialog] = React.useState(null);
  
  let location = useLocation();
  const eventKey = location.state.eventKey;
  const myEvent = location.state.myEvent;

  // Get tiers from chosen project
  const getTicketCategoriesFromEvent = async () => {
    const ticketCategoriesQuery = ` {
      ticketCategories(where: { eventId: "` + eventKey + `" }) {
        id
        eventId
        currentMintTickets
        maxTickets
        ticketPrice
        resellTicketValue
        metadataIpfsCid
      }
    }`;

    var dataFromSubGraph = await ApolloClientCustom.query({
      query: gql(ticketCategoriesQuery)
    });
    var ticketCategories = dataFromSubGraph.data.ticketCategories;
    if (ticketCategories.length > 0) {
      var data = [];
      for (var counter = 0; counter < ticketCategories.length; counter++) {
        const ipfsData = await getTicketCategoryDetail(ticketCategories[counter].metadataIpfsCid);
        if (ipfsData) {
          var buyButtonFlag = true;
          if (StringToBoolean(myEvent) === true || parseInt(ticketCategories[counter].currentMintTickets) === parseInt(ticketCategories[counter].maxTickets)) {
            buyButtonFlag = false;
          }

          data.push({
            key: parseInt(ticketCategories[counter].id),
            price: ethers.utils.formatEther(ticketCategories[counter].ticketPrice).toString(),
            sold_tickets: ticketCategories[counter].currentMintTickets,
            max_tickets: ticketCategories[counter].maxTickets,
            resell_ticket_value: ticketCategories[counter].resellTicketValue,
            name: ipfsData.categoryName,
            description: ipfsData.description,
            buy_button: buyButtonFlag
          });
        }
      }
    
      return data;
    }
    return [];
  }

  // Get tier detail from database
  const getTicketCategoryDetail = async(metadataIpfsCid) =>  {
    if (ipfs) {
      const ipfsData = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCid)));
      const ipfsDataJSON = JSON.parse(uint8ArrayToString(ipfsData));
      
      return ipfsDataJSON;
    }
    return null;
  }

  const getTickets = async () => {
    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    var tickets = [];
    if (ticketsTypes === TicketsTypesEnum.MY_TICKETS) {
      tickets = await getMyTickets(address, null);
    } else if (ticketsTypes === TicketsTypesEnum.FOR_SELL) {
      tickets = await getTicketsForSell(address, null);
    }
    /*
    const itemMetaById =  await axios.get(EnvConstant.raribleServer + `/protocol/v0.1/ethereum/nft/items/` +  EnvConstant.contractAddress + `:3/meta`);
    console.log(itemMetaById);
    */
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
        obj.price_in_usd = ordersByItem[0].makePriceUsd.toFixed(2);
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
      
      obj.for_offer = true;
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
      obj.price_in_usd = obj.makePriceUsd.toFixed(2);

      obj.order = obj;
      obj.for_offer = false;
      data.push(obj);
    }
    return data;
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

  // Dialog for buy ticket button - on buy click
  const buyTicketDialogHandleBuy = async() => {
    const signer = Provider.getSigner()
    const maker = await signer.getAddress();
    const preparedTx = await PrepareTx(orderForDialog.hash, maker, 1)
    const tx = {
      from: maker,
      data: preparedTx.transaction.data,
      to: preparedTx.transaction.to,
      value: "0x09184e72a000"
    }
    console.log("sending tx", tx);
   // const sendTransactionResponse = await signer.sendTransaction(tx);

    const sendTransactionResponse = await Provider.send("eth_sendTransaction", [tx]);
    console.log(sendTransactionResponse);
  }

  // Dialog for sell button - close
  const sellDialogHandleClose = () => {
    setTokenForDialog(-1)
    setSellDialogOpen(false);
  };


  // Dialog for sell button - on sell click
  const sellDialogHandleSell  = async() => {

    setSellDialogOpen(false);
    onSetOverlay(true);

    const signer = Provider.getSigner()
    const address = await signer.getAddress();
    const priceForSellWei = ethers.utils.parseEther(priceForSell);

    const form = CreateMakerOrder(address, EnvConstant.contractAddress, tokenForDialog, priceForSellWei.toString());
    const orderDataJSON = await axios.post(EnvConstant.raribleServer + "/protocol/v0.1/ethereum/order/encoder/order", form);
    const msg =orderDataJSON.data.signMessage;
    const signature = await SignOrderMessage(
      msg.struct, msg.types, msg.structType, msg.domain, form.maker
    )

    form.signature = signature;
    await axios.post(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/order/orders", form);

    onReloadList(true);
    onSetOverlay(false);
  }

  // Dialog for cancel sell - open
  const cancelSellDialogHandleOpen = (tokenKey, order) =>  {
    setTokenForDialog(tokenKey);
    setOrderForDialog(order);
    setCancelSellDialogOpen(true);
  }
  
  // Dialog for cancel sell - close
  const cancelSellDialogHandleClose = () => {
    setTokenForDialog(-1);
    setOrderForDialog(null);
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
        const makerAddress = await  signer.getAddress();
        const cancelOrder = CreateCancelOrder(makerAddress, 
          Asset(ERC721, enc(orderForDialog.make.assetType.contract), orderForDialog.make.value), 
          ZERO, 
          Asset(ETH, enc(ZERO), orderForDialog.take.value), 
          1, 
          0, 
          0, 
          ORDER_DATA_V1, 
          {
            "dataType": "RARIBLE_V2_DATA_V1",
            "payouts": [],
            "originFees": [],
          });
        const transactionDetail = await raribleExchangeContractWithSigner.cancel(cancelOrder);
        console.log(transactionDetail);
        onReloadList(true);
        onSetOverlay(false);
      } catch (error) {
        console.log(error);
        onSetOverlay(false);
      }
    }
  }

  const handleChangeTicketsTypes = (ticketType) => {
    setTicketTypes(ticketType);
  };

  const classes = useStyles();

  return (<div>
    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'left', alignItems:'center'}}>
        <h5>Ticket categories</h5>
      </div>
    </Box>
    <Async promiseFn={getTicketCategoriesFromEvent}>
      <Async.Loading>Loading...</Async.Loading>
      <Async.Fulfilled>
        {data => {
        return (
          <Grid container spacing={3}>
            {data.map(ticketCategory=> (
              <Grid item xs key={ticketCategory.key}>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        {ticketCategory.name}
                        <br />
                        <br />
                        </Typography>  
                        <Typography variant="body2" component="span">
                        {ticketCategory.description.split("\n").map((i, key) => {
                          return <p key={key}>{i}</p> ;
                        })}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="span" color="textSecondary">
                        #Price {ticketCategory.price} ETH
                        <br />
                        </Typography>
                        <Typography variant="body2" component="span" color="textSecondary">
                        #Subscribed {ticketCategory.sold_tickets}/{ticketCategory.max_tickets === 0 ? "Unlimited" : ticketCategory.max_tickets}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="span" color="textSecondary">
                        #Resell fee (royalty) - {ticketCategory.resell_ticket_value} %
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Box component="div" visibility={ticketCategory.buy_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { 
                              //buyDialogHandleOpen(ticketCategory.key, ticketCategory.name, ticketCategory.price)
                              setBuyDialogOpen(true)
                            }} size="small" >Buy</Button>
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

    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'left', alignItems:'center', padding:"5"}}>
        <h5>Tickets</h5>
      </div>

      <Box pt={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Tickets types</FormLabel>
          <RadioGroup aria-label="Tickets types" row  name="ti" value={ticketsTypes} onChange={ event => handleChangeTicketsTypes(event.target.value)}>
            <FormControlLabel value={TicketsTypesEnum.MY_TICKETS} control={<Radio />} label="My tickets" />
            <FormControlLabel value={TicketsTypesEnum.FOR_SELL} control={<Radio />} label="For sell" />
            <FormControlLabel value={TicketsTypesEnum.FOR_OFFER} control={<Radio />} label="For offer" />
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
                          <Box component="div" visibility={ticket.buy_ticket_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyTicketDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={ticket.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(ticket.tokenId)}} size="small" >Sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Cancel sell</Button>
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


    <BuyDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} eventKey={eventKey} buyDialogOpen={buyDialogOpen}>

    </BuyDialog>

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

    <Dialog open={sellDialogOpen} onClose={() => sellDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Sell ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to sell ticket ID "{tokenForDialog}"?
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
          Sell
        </Button>
      </DialogActions>
    </Dialog>

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

  </div>);
}

function BuyDialog({onReloadList, onSetOverlay, eventKey, buyDialogOpen}) {

  const classes = useStyles();
  
  const [buyDialogOpenInner, setBuyDialogOpenInner] = React.useState(buyDialogOpen);
  const [ticketCategoryKeyForDialog, setTicketCategoryKeyForDialog] = React.useState(-1);
  const [ticketCategoryNameForDialog, setTicketCategoryNameForDialog] = React.useState("");
  const [ticketCategoryPriceForDialog, setTicketCategoryPriceForDialog] = React.useState(0);
  const [totalNumberOfTickets, setTotalNumberOfTickets] = React.useState(1);

  // Dialog for buy button - open
  const buyDialogHandleOpen = (ticketCategoryKey, ticketCategoryName, ticketCategoryPrice) =>  {
    setTotalNumberOfTickets(1);
    setTicketCategoryKeyForDialog(ticketCategoryKey);
    setTicketCategoryNameForDialog(ticketCategoryName);
    setTicketCategoryPriceForDialog(ticketCategoryPrice);
    setBuyDialogOpenInner(true);
  }
  
  // Dialog for buy button - close
  const buyDialogHandleClose = () => {
    setTotalNumberOfTickets(1);
    setTicketCategoryKeyForDialog(-1)
    setTicketCategoryNameForDialog("");
    setTicketCategoryPriceForDialog(0);
    setBuyDialogOpenInner(false);
  };

  // Dialog for buy button - buy
  const buyDialogHandleBuy = async() => {
    
    setBuyDialogOpenInner(false);
    onSetOverlay(true);
    try {
      // Get a token id
      const signer = Provider.getSigner()
      const address = await signer.getAddress();
      var tokensId = [];
      var pinataIPFSData = [];
      for (var counter = 0; counter < parseInt(totalNumberOfTickets); counter++) {
        // Get token id for new token
        const tokenIdData =  await axios.get(EnvConstant.raribleServer + `/protocol/v0.1/ethereum/nft/collections/` + EnvConstant.contractAddress +`/generate_token_id?minter=`+ address + ``);
        const tokenId = tokenIdData.data.tokenId;
        tokensId.push(tokenId);

        var data = JSON.stringify({
          "name":"NFT -" + tokenId,
          "description":"-",
          "image":"",
          "external_url":"https://app.rarible.com/" + EnvConstant.contractAddress + ":" + tokenId,
          "attributes":[{
            "eventId": eventKey,
            "ticketCategoryId": ticketCategoryKeyForDialog
          }]
        });

        // Add to pinata
        const url = EnvConstant.pinataURL + "/pinJSONToIPFS";
        const pinataIPFS = await axios.post(url, data, EnvConstant.pinataHeader);
        pinataIPFSData.push("/ipfs/" + pinataIPFS.data.IpfsHash);
      }

      // Call contract function
      const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, Provider);
      const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
      var _ticketCategoryPrice = parseFloat(ticketCategoryPriceForDialog) * parseInt(totalNumberOfTickets);
      let overrides = {
        // To convert Ether to Wei:
        value: ethers.utils.parseEther(_ticketCategoryPrice.toString()) // ether in this case MUST be a string
      };

      //Mint token (ticket)
      const tx = await nftTicketizeContractWithSigner.customMint(
        address,
        eventKey,
        ticketCategoryKeyForDialog,
        tokensId,
        pinataIPFSData,
        overrides
      );

      const receipt = await tx.wait();
      console.log('Minting Success', receipt);
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (err) {  
      console.log(err);
      onReloadList(true);
      onSetOverlay(false);
    };
  }

  return (<Dialog open={buyDialogOpenInner} onClose={() => buyDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Buy ticket</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to buy ticket for category "{ticketCategoryNameForDialog}"?
        </DialogContentText>
        <FormControl className={classes.labelFormControl}>
          <InputLabel id="select-tier-time-limit">Number of tickets?</InputLabel>
          <Select
            labelId="select-tier-time-limit"
            id="Event type"
            defaultValue={totalNumberOfTickets}
            onChange={event => {
              setTotalNumberOfTickets(event.target.value);
            }}
            >
            <MenuItem value='1'>1</MenuItem>
            <MenuItem value='2'>2</MenuItem>
            <MenuItem value='3'>3</MenuItem>
            <MenuItem value='4'>4</MenuItem>
            <MenuItem value='5'>5</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => buyDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => buyDialogHandleBuy()} color="primary">
          Buy
        </Button>
      </DialogActions>
    </Dialog>);
}
function ButtonsBox({onReloadList, onSetOverlay, onSetSnackBarMessage, ipfs}) {
  
  const [open, setOpen] = React.useState(false);
  const [categoryName, setCategoryName] = React.useState("");
  const [categoryNameValidation, setCategoryNameValidation] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [descriptionValidation, setDescriptionValidation] = React.useState(false);
  const [maxSubscriber, setMaxSubscriber] = React.useState(-1);
  const [price, setPrice] = React.useState(0);
  const [priceValidation, setPriceValidation] = React.useState(false);
  const [resellFeeValue, setResellFeeValue] = React.useState(0);
  const [resellFeeValueValidation, setResellFeeValueValidation] = React.useState(false);

  let location = useLocation();
  const eventKey = location.state.eventKey;

  // Create new tier button
  const createNewTicketCategory = async (eventKey, categoryName, description, maxSubscriber,
    price, resellFeeValue) => {

    onSetOverlay(true);

    const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, Provider);

    //Insert into IPFS
    const dataForIpfs = {
      categoryName: categoryName,
      description: description
    };
    const { cid } = await ipfs.add(JSON.stringify(dataForIpfs));

    //Insert into smart contract
    const signer = Provider.getSigner()
    const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
    try {
      var _eventKey = parseInt(eventKey);
      var _maxSubscriber = maxSubscriber;
      var _parsePrice = ethers.utils.parseEther(price);
      var _resellFeeValue = parseInt(resellFeeValue);

      const transactionDetail = await nftTicketizeContractWithSigner.createTicketCategory(_eventKey, _maxSubscriber, _parsePrice, _resellFeeValue, cid.string);
      await ipfs.pin.add(cid.string);
      
      setOpen(false);
      await Provider.waitForTransaction(transactionDetail.hash);
      onSetSnackBarMessage("Event category is success created", "success");
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (error) {
      onSetSnackBarMessage(error.message, "error");
      onSetOverlay(false);
    }
  }

  // On open create new event category
  const handleClick = () => {
    setOpen(true);
  };

  // On close create new event category
  const handleClose = () => {
    setOpen(false);
  };


  // On create new event category button dialog button
  const handleCreteNewTicketCategory = () => {
    // Validation for name
    if (!categoryName) {
      setCategoryNameValidation(true);
      return;
    } else {
      setCategoryNameValidation(false);
    }

    // validation for description
    if (!description) {
      setDescriptionValidation(true);
      return;
    } else {
      setDescriptionValidation(false);
    }

    // validation for price
    if (!price === 0) {
      setPriceValidation(true);
      return;
    } else {
      setPriceValidation(false);
    }

    if (!resellFeeValue) {
      setResellFeeValue(0);
    }

    // Call create new tier procedure
    createNewTicketCategory(eventKey, categoryName, description, maxSubscriber,
      price, resellFeeValue);
    setOpen(false);
  };

    return (
      <div>
        <div>
          <Box m={2} pt={1}>
            <Button variant="outlined" color="primary" onClick={handleClick}>
              New ticket category
            </Button>
          </Box>
          <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">New Ticket Category</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="category_name"
                label="Category name"
                required
                fullWidth
                onChange={event => {
                  setCategoryName(event.target.value);
                }}
                error={categoryNameValidation}
              />
              <TextField
                margin="dense"
                id="description"
                label="Description"
                required
                multiline
                rows={4}
                fullWidth
                onChange={event => {
                  setDescription(event.target.value);
                }}
                error={descriptionValidation}
              />
              <TextField
                margin="dense"
                id="total_number"
                label="Total number of limited tokens(max subscriber)?"
                fullWidth
                onChange={event => {
                  setMaxSubscriber(event.target.value);
                }}
                type="number"
                min="1"
              />
              <TextField
                margin="dense"
                id="ticket_price"
                label="Ticket price (in ETH)"
                required
                fullWidth
                onChange={event => {
                  setPrice(event.target.value);
                }}
                type="number"
                error={priceValidation}
                min="0"
              />
              <TextField
                margin="dense"
                id="resell_fee_value"
                label="Resell fee for event owner - percent (royalty)"
                required
                fullWidth
                onChange={event => {
                  setResellFeeValue(event.target.value);
                }}
                type="number"
                error={resellFeeValueValidation}
                min="0"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreteNewTicketCategory} color="primary">
                Create New
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
}


function EventDetailInner({ipfs}) {
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

  let location = useLocation();
  const myEvent = location.state.myEvent;
  const eventName = location.state.eventName;
  if (myEvent === "true") {
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
          <Box m={2} pt={1}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                <h4>Event "{eventName}" detail</h4>
            </div>
          </Box>
          <ButtonsBox onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} onSetSnackBarMessage = {setSnackBarMessage} ipfs = {ipfs}>
          </ButtonsBox>
          <TicketCategoryDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} ipfs = {ipfs}>
          </TicketCategoryDetail>
        </div>
      </LoadingOverlay>
    ); 
  } else {
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
          <Box m={2} pt={1}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                <h4>Event "{eventName}" detail</h4>
            </div>
          </Box>
          <TicketCategoryDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} ipfs = {ipfs}>
          </TicketCategoryDetail>
        </div>
      </LoadingOverlay>
    );
  }
}

export default function EventDetail(props) {
  const ipfs = props.ipfs;
  return (
    <SnackbarProvider maxSnack={3}>
      <EventDetailInner ipfs = {ipfs} />
    </SnackbarProvider>
  );
}