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
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import { EnvConstant} from ".././const";
import Async from 'react-async';
import { useLocation } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { ethers } from "ethers";
import { TypedDataUtils } from 'ethers-eip712';
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';
import { SnackbarProvider, useSnackbar } from 'notistack';
import axios from 'axios';

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

// Ethers.js initialization
const provider = new ethers.providers.Web3Provider(window.ethereum); 
const NFTicketizeContractArt = require( "../contracts/NFTicketize.json");

const { createTypeData, signTypedData, signTypedDataEthersJS } = require("../EIP712");

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
const client = new ApolloClient({
  uri: EnvConstant.theGraphAPIUrl,
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions
});

const uint8ArrayToString = require('uint8arrays/to-string');
const uint8ArrayConcat = require('uint8arrays/concat');
const all = require('it-all');

function TicketCategoryDetail({onReloadList, onSetOverlay, ipfs}) {  
  const [buyDialogOpen, setBuyDialogOpen] = React.useState(false);
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const [cancelSellDialogOpen, setCancelSellDialogOpen] = React.useState(false);
  const [burnDialogOpen, setBurnDialogOpen] = React.useState(false);
  const [ticketCategoryKeyForDialog, setTicketCategoryKeyForDialog] = React.useState(-1);
  const [tokenForDialog, setTokenForDialog] =  React.useState(-1);
  const [ticketCategoryNameForDialog, setTicketCategoryNameForDialog] = React.useState("");
  const [ticketCategoryPriceForDialog, setTicketCategoryPriceForDialog] = React.useState(0);
  const [totalNumberOfTickets, setTotalNumberOfTickets] = React.useState(1);
  const [priceForSell, setPriceForSell] = React.useState("");
  const [priceForSellValidation, setPriceForSellValidation] = React.useState(false);
  
  let location = useLocation();
  const eventKey = location.state.eventKey;
  const myEvent = location.state.myEvent;

  // Get tiers from chosen project
  const getTicketCategoriesFromEvent = async () => {
    const ticketCategoriesQuery = ` {
      ticketCategories(where: { eventId: "` + eventKey + `" }) {
        id
        eventId
        maxTickets
        ticketPrice
        resellTicketValue
        metadataIpfsCid
      }
    }`;

    var dataFromSubGraph = await client.query({
      query: gql(ticketCategoriesQuery)
    });
    var ticketCategories = dataFromSubGraph.data.ticketCategories;
    if (ticketCategories.length > 0) {
      var data = [];
      for (var counter = 0; counter < ticketCategories.length; counter++) {
        const ipfsData = await getTicketCategoryDetail(ticketCategories[counter].metadataIpfsCid);
        if (ipfsData) {
          data.push({
            key: parseInt(ticketCategories[counter].id),
            price: ethers.utils.formatUnits(ticketCategories[counter].ticketPrice, "gwei"),
            sold_tickets: 0,
            max_tickets: ticketCategories[counter].maxTickets,
            resell_ticket_type: ticketCategories[counter].resellTicketType,
            resell_ticket_value: ticketCategories[counter].resellTicketValue,
            name: ipfsData.categoryName,
            description: ipfsData.description,
            buy_button: true,
            sell_button: true,
            cancel_sell_button: true
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
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    const itemsByOwner =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + address + `&size=100`);
    const itemsByCollection =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/items/byCollection?collection=` + EnvConstant.contractAddress + `&size=100`);
    var tickets = await getTicketsByOwnerContinuation(address, null);
    
    /*
    const itemMetaById =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/items/` +  EnvConstant.contractAddress + `:3/meta`);
    console.log(itemMetaById);
    */
    return tickets;
  }

  const getTicketsByOwnerContinuation = async (_address, _continuation) => {
    var tickets;
    var newTickets;
    if (_continuation == null) {
      const itemsByOwner =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100`);
      if (itemsByOwner.data.items.length > 0) {
        tickets = getTicketsDataItems(itemsByOwner.data.items);
        newTickets = await getTicketsByOwnerContinuation(_address, itemsByOwner.data.continuation);
        if (newTickets.length > 0) {
          tickets.push(newTickets);
        }
        return tickets;
      }
    } else {
      const itemsByOwner =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/items/byOwner?owner=` + _address + `&size=100&continuation=` + _continuation);
      if (itemsByOwner.data.items.length > 0) {
        tickets = getTicketsDataItems(itemsByOwner.data.items);
        newTickets = await getTicketsByOwnerContinuation(_address, itemsByOwner.data.continuation);
        if (newTickets.length > 0) {
          tickets.push(newTickets);
        }
        return tickets;
      } 
    }
    return [];
  }

  const getTicketsDataItems = (ticketsDataItems) => {
    var data = [];
    for(var counter = 0; counter < ticketsDataItems.length; counter++) {
      if (ticketsDataItems[counter].contract.toLowerCase() === EnvConstant.contractAddress.toLowerCase()) {
        var obj = ticketsDataItems[counter];
        obj.buy_button = true;
        obj.sell_button = true;
        obj.cancel_sell_button = true;
        data.push(obj);
      }
    }
    return data;
  }

  

  // Dialog for buy button - open
  const buyDialogHandleOpen = (ticketCategoryKey, ticketCategoryName, ticketCategoryPrice) =>  {
    setTotalNumberOfTickets(1);
    setTicketCategoryKeyForDialog(ticketCategoryKey);
    setTicketCategoryNameForDialog(ticketCategoryName);
    setTicketCategoryPriceForDialog(ticketCategoryPrice);
    setBuyDialogOpen(true);
  }

  // Dialog for buy button - close
  const buyDialogHandleClose = () => {
    setTotalNumberOfTickets(1);
    setTicketCategoryKeyForDialog(-1)
    setTicketCategoryNameForDialog("");
    setTicketCategoryPriceForDialog(0);
    setBuyDialogOpen(false);
  };

  // Dialog for buy button - buy
  const buyDialogHandleBuy = async() => {
    
    setBuyDialogOpen(false);
    onSetOverlay(true);
    try {
      // Get a token id
      const signer = provider.getSigner()
      const address = await signer.getAddress();
      var tokensId = [];
      for (var counter = 0; counter < parseInt(totalNumberOfTickets); counter++) {
        const tokenIdData =  await axios.get(`https://api-dev.rarible.com/protocol/v0.1/ethereum/nft/collections/` + EnvConstant.contractAddress +`/generate_token_id?minter=`+ address + ``);
        const tokenId = tokenIdData.data.tokenId;
        tokensId.push(tokenId);
      }

      // Call the functionss
      const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, provider);
      const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
      var _ticketCategoryPrice = parseFloat(ticketCategoryPriceForDialog) * parseInt(totalNumberOfTickets);
      let overrides = {
        // To convert Ether to Wei:
        value: ethers.utils.parseEther(_ticketCategoryPrice.toString())     // ether in this case MUST be a string
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      
      var data = JSON.stringify({
        "name":"Test NFT",
        "description":"Test NFT",
        "image":"ipfs://ipfs/QmW4P1Mgoka8NRCsFAaJt5AaR6XKF6Az97uCiVtGmg1FuG/image.png",
        "external_url":"https://app.rarible.com/" + EnvConstant.contractAddress + ":" + tokensId[0],
        "attributes":[{
          "key":"Test",
          "trait_type":"Test",
          "value":"Test"
        }]
      });

      const url = EnvConstant.pinataURL + "/pinJSONToIPFS";
      const pinataIPFS = await axios.post(url, data, EnvConstant.pinataHeader);
      const pinataIPFSData = "/ipfs/" + pinataIPFS.data.IpfsHash;

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

  // Dialog for sell button - open
  const sellDialogHandleOpen = (tokenKey, tierName) =>  {
    setTokenForDialog(tokenKey);
    setTicketCategoryNameForDialog(tierName);
    setSellDialogOpen(true);
  }

  // Dialog for sell button - close
  const sellDialogHandleClose = () => {
    setTokenForDialog(-1)
    setTicketCategoryNameForDialog("");
    setSellDialogOpen(false);
  };


  const getTypeData = (signMessage) => {
    const chainId = Number(provider._network.chainId);
    const data = createTypeData({
      name: signMessage.domain.name,
      version: signMessage.domain.version,
      chainId: chainId,
      verifyingContract: signMessage.domain.verifyingContract
    }, signMessage.structType, signMessage.struct, signMessage.types);
    return data;
  };
    async function sign (web3, signMessage, account) {
      const chainId = Number(provider._network.chainId);
      const data = createTypeData({
        name: signMessage.domain.name,
        version: signMessage.domain.version,
        chainId: chainId,
        verifyingContract: signMessage.domain.verifyingContract
    }, signMessage.structType, signMessage.struct, signMessage.types);
    const x = await web3.send(
      "eth_signTypedData_v3",
       [account, JSON.stringify(data)]
    );
    return x;
    //return (await signTypedDataEthersJS(web3, account, data)).sig;
    
   // return (await signTypedData(web3, account, data)).sig;
  }

  const createOrder = (
    maker, contract, tokenId, price,
  ) =>{
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
  
  const prepareOrderMessage = async(form) => {
    const res = await client.post<EncodedOrder>("/protocol/v0.1/ethereum/order/encoder/order", form)
    return res.data
  }

  const signOrderMessage = (
    struct,
    types,
    structType,
    domain,
    account
  ) => {
    const data = createTypeData(
      domain,
      structType,
      struct,
      types,
    )
    console.log("signing", data)
    return signTypedData(account, data)
  }

  const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
  
  // Dialog for sell button - on sell click
  const sellDialogHandleSell  = async() => {

    const signer = provider.getSigner()
    const address = await signer.getAddress();

    const form = createOrder(address, EnvConstant.contractAddress, tokenForDialog, "1000000000000000000");
    const msg = await axios.post("https://api-staging.rarible.com/protocol/v0.1/ethereum/order/encoder/order", form);
    const signature = await signOrderMessage(
      msg.struct, msg.types, msg.structType, msg.domain, form.maker
    )
/*
    const orderJSON = {
      "type": "RARIBLE_V2",
      "maker": address,
      "make": {
          "assetType": {
              "assetClass": "ERC721",
              "contract": EnvConstant.contractAddress,
              "tokenId": parseInt(tokenForDialog)
          },
          "value": "1"
      },
      "take": {
          "assetType": {
              "assetClass": "ETH"
          },
          "value": "1000000000000000000"
      },
      "data": {
          "dataType": "RARIBLE_V2_DATA_V1",
          "payouts": [],
          "originFees": []
      },
      "salt": "3621"
  };
  const orderJSONResponse = await axios.post("https://api-staging.rarible.com/protocol/v0.1/ethereum/order/encoder/order", orderJSON);
  /*var signMessage = orderJSONResponse.data.signMessage;
  const data = createTypeData({
    name: signMessage.domain.name,
    version: signMessage.domain.version,
    chainId: signMessage.domain.chainId,
    verifyingContract: signMessage.domain.verifyingContract
  }, signMessage.structType, signMessage.struct, signMessage.types);
  const digest = TypedDataUtils.encodeDigest(data);
  const signature = await signer.signMessage(digest)
 
  console.log(signature);

  orderJSON.signature = signature;
  const sendSellOrder = await axios.post("https://api-staging.rarible.com/protocol/v0.1/ethereum/order/orders", orderJSON);

  console.log(sendSellOrder)
  const chainId = Number(provider._network.chainId);
    const domain = orderJSONResponse.data.signMessage.domain;
    domain.chainId = chainId;
  // The named list of all type definitions
  const types = orderJSONResponse.data.signMessage.types;

  // The data to sign
  const value = orderJSONResponse.data.signMessage.struct;

  const signature = await signer._signTypedData(domain, types, value);

  //const signature = await sign(signer.provider, orderJSONResponse.data.signMessage, address)
  console.log(signature);

  orderJSON.signature = signature;
  const sendSellOrder = await axios.post("https://api-staging.rarible.com/protocol/v0.1/ethereum/order/orders", orderJSON);

  console.log(sendSellOrder);
  ;
  const digest = TypedDataUtils.encodeDigest(getTypeData(orderJSONResponse.data.signMessage));
  const signature = await signer._signMessage(digest);
  console.log(signature);*/
    /*
    // Get sell price
    if (!priceForSell){
      setPriceForSellValidation(true);
      return;
    } else {
      setPriceForSellValidation(false);
    }

    setSellDialogOpen(false);
    onSetOverlay(true);

    try {
      
      onReloadList(true);
      onSetOverlay(false);
    } catch (err) {  
      onSetOverlay(false);
    }; */
  }

  // Dialog for cancel sell - open
  const cancelSellDialogHandleOpen = (tokenKey, tierName) =>  {
    setTokenForDialog(tokenKey);
    setTicketCategoryNameForDialog(tierName);
    setCancelSellDialogOpen(true);
  }
  
  // Dialog for cancel sell - close
  const cancelSellDialogHandleClose = () => {
    setTokenForDialog(-1);
    setTicketCategoryNameForDialog("");
    setCancelSellDialogOpen(false);
  };

  // Dialog for cancel sell - on cancel sell 
  const cancelSellDialogHandleSell = async() => {
    /*
    try {
      setCancelSellDialogOpen(false);
      onSetOverlay(true);

      //You can sell tier
      const myGasPrice = units.toQa(EnvConstant.gasPrice, units.Units.Li); 
      const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
      const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); 

      if (isGasSufficient) {
        const VERSION = bytes.pack(EnvConstant.chainId, EnvConstant.msgVersion);
        const params = {
          // amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(8000),
        };

        var tokenId = tokenForDialog;
        if (tokenId && tokenId !== -1) {
          const args = [{
              vname: 'token_id',
              type: 'Uint256',
              value: tokenId,
            }
          ];

          // Call transition on smart contract
          const result = await magic.zilliqa.callContract(
            'SetCancelTokenForSell', args, params, 33, 1000, false, EnvConstant.contractAddress
          );

          if (result){
            if (result.receipt){
              if (result.receipt.success){
                onReloadList(true);
                onSetOverlay(false);
                return;
              }
            }
          }
        }
      }
      onReloadList(true);
      onSetOverlay(false);
    } catch (err) {  
      onSetOverlay(false);
    };*/
  }

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
                        #Resell fee (type) - {ticketCategory.resell_type === 1? "Percent" : "Fixed"}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="span" color="textSecondary">
                        #Resell fee (value) - {ticketCategory.resell_value} {ticketCategory.resell_type === 1? "%" : " ETH "}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Box component="div" visibility={ticketCategory.buy_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyDialogHandleOpen(ticketCategory.key, ticketCategory.name, ticketCategory.price)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={ticketCategory.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(ticketCategory.token_key, ticketCategory.name)}} size="small" >Sell</Button>
                          </Box>
                          <Box component="div" visibility={ticketCategory.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(ticketCategory.token_key, ticketCategory.name)}} size="small" >Cancel sell</Button>
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
    </Box>
      
    <Async promiseFn={getTickets}>
      <Async.Loading>Loading...</Async.Loading>
      <Async.Fulfilled>
        {data => {
        return (
          <Grid container spacing={3} direction='column'>
            {data.map(ticket=> (
              <Grid item xs>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        {ticket.tokenId}
                        <br />
                        <br />
                        </Typography>  
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Created time {ticket.date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Box component="div" visibility={ticket.buy_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyDialogHandleOpen(ticket.tokenId)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={ticket.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(ticket.tokenId)}} size="small" >Sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(ticket.tokenId)}} size="small" >Cancel sell</Button>
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

    <Dialog open={buyDialogOpen} onClose={() => buyDialogHandleClose()} aria-labelledby="form-dialog-title">
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
    </Dialog>

    <Dialog open={sellDialogOpen} onClose={() => sellDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Sell tier</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to sell tier "{ticketCategoryNameForDialog}"?
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
      <DialogTitle id="form-dialog-title">Cancel sell tier</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to cancel sell tier "{ticketCategoryNameForDialog}"?
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

    const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, provider);

    //Insert into IPFS
    const dataForIpfs = {
      categoryName: categoryName,
      description: description
    };
    const { cid } = await ipfs.add(JSON.stringify(dataForIpfs));

    //Insert into smart contract
    const signer = provider.getSigner()
    const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
    try {
      var _eventKey = parseInt(eventKey);
      var _maxSubscriber = maxSubscriber;
      var _parsePrice = ethers.utils.parseUnits(price, "gwei");
      var _resellFeeValue = parseInt(resellFeeValue);

      const transactionDetail = await nftTicketizeContractWithSigner.createTicketCategory(_eventKey, _maxSubscriber, _parsePrice, _resellFeeValue, cid.string);
      await ipfs.pin.add(cid.string);
      
      setOpen(false);
      await provider.waitForTransaction(transactionDetail.hash);
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
          <Dialog open={open} validate onClose={handleClose} aria-labelledby="form-dialog-title">
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