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
import { gql } from '@apollo/client';
import { SnackbarProvider, useSnackbar } from 'notistack';
import axios from 'axios';
import { StringToBoolean,} from ".././UtilsData";
import { ApolloClientCustom, Provider, CreateIPFSRef, SignTypedData, CreateTypeData} from ".././UtilsData";
import TicketMarket from './TicketMarket';
import {ERC721Types} from './domain';


const textToImage = require('text-to-image');

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

const uint8ArrayToString = require('uint8arrays/to-string');
const uint8ArrayConcat = require('uint8arrays/concat');
const all = require('it-all');

let ipfs = null;

function TicketCategoryDetail({onReloadList, onSetOverlay, onSetSnackBarMessage}) {  
 
  const [buyDialogOpen, setBuyDialogOpen] = React.useState(false);
  const [ticketCategoryKeyForDialog, setTicketCategoryKeyForDialog] = React.useState(-1);
  const [ticketCategoryNameForDialog, setTicketCategoryNameForDialog] = React.useState("");
  const [ticketCategoryPriceForDialog, setTicketCategoryPriceForDialog] = React.useState(0);
  
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
    if (ipfs != null) {
      const ipfsData = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCid)));
      const ipfsDataJSON = JSON.parse(uint8ArrayToString(ipfsData));
      return ipfsDataJSON;
    }
    return null;
  }

  // Dialog for buy button - open
  const buyDialogHandleOpen = (ticketCategoryKey, ticketCategoryName, ticketCategoryPrice) =>  {
    setTicketCategoryKeyForDialog(ticketCategoryKey);
    setTicketCategoryNameForDialog(ticketCategoryName);
    setTicketCategoryPriceForDialog(ticketCategoryPrice);
    setBuyDialogOpen(true);
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
                        #Tickets sold {ticketCategory.sold_tickets}/{ticketCategory.max_tickets === 0 ? "Unlimited" : ticketCategory.max_tickets}
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
                              buyDialogHandleOpen(ticketCategory.key, ticketCategory.name, ticketCategory.price)
                            }} size="small">Buy</Button>
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

    <BuyDialog onReloadList={onReloadList} onSetOverlay={onSetOverlay} onSetSnackBarMessage={onSetSnackBarMessage}
      eventKey={eventKey} buyDialogOpen={buyDialogOpen} setBuyDialogOpen={setBuyDialogOpen}
      ticketCategoryNameForDialog={ticketCategoryNameForDialog} ticketCategoryKeyForDialog={ticketCategoryKeyForDialog}
      ticketCategoryPriceForDialog={ticketCategoryPriceForDialog}>
    </BuyDialog>

    <TicketMarket eventKey = {eventKey}>
    </TicketMarket>
  </div>);
}

function BuyDialog({onReloadList, onSetOverlay, onSetSnackBarMessage, eventKey, buyDialogOpen, setBuyDialogOpen,
  ticketCategoryNameForDialog, ticketCategoryKeyForDialog, ticketCategoryPriceForDialog,}) {

  let location = useLocation();
  const eventName = location.state.eventName;

  const classes = useStyles();
  
  const [totalNumberOfTickets, setTotalNumberOfTickets] = React.useState(1);


  // Dialog for buy button - close
  const buyDialogHandleClose = () => {
    setTotalNumberOfTickets(1);
    setBuyDialogOpen(false);
  };
  
  async function putLazyMint(form) {
    const res = await axios.post(EnvConstant.raribleServer +"/protocol/v0.1/ethereum/nft/mints", form)
    console.log(res);
    return res.data
  }
  
 async function signAndPutLazyMint(form) {
    const signed = await signLazyMint(form)
    console.log(signed);
    return putLazyMint(signed)
  }
  
  async function signLazyMint(form) {
    const signature = await signLazyMintMessage(
      form,
      form.creators[0].account,
      3,
      EnvConstant.contractAddress
    );
    return { ...form, signatures: [signature] }
  }
  
  async function signLazyMintMessage(
    form,
    account,
    chainId,
    verifyingContract
  ) {
    const typeName = "Mint721";
    const data = CreateTypeData(
      {
        name: typeName,
        version: "1",
        chainId,
        verifyingContract
      },
      typeName,
      { ...form, tokenURI: form.uri },
      ERC721Types
    );
    console.log("signing", data)
    return SignTypedData(account, data);
  }

  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    //return new Blob([ia], {type:mimeString});
    return new Blob([ia], {type: 'image/jpeg'});
}

  // Dialog for buy button - buy
  const buyDialogHandleBuy = async() => {

    setBuyDialogOpen(false);
    onSetOverlay(true);

    const signer = Provider.getSigner()
    const creator = await signer.getAddress();
    var tokensId = [];
    try {
      for (var counter = 0; counter < parseInt(totalNumberOfTickets); counter++) {
        const resGenerateToken = await axios.get(EnvConstant.raribleServer +`/protocol/v0.1/ethereum/nft/collections/`+EnvConstant.contractAddress+`/generate_token_id?minter=${creator}`)
        const tokenId = resGenerateToken.data.tokenId;

        const dataUriTicketImage = await textToImage.generate("Event name: " + eventName  + "\n" +
          "Ticket category: " + ticketCategoryNameForDialog + "\n" +
          "Ticket ID: #" + tokenId);
        var blobTicketImage = dataURItoBlob(dataUriTicketImage);

        //var file = new File( [blob], 'canvasImage.jpg', { type: 'image/jpeg' } ); 
       
        var fdTicketImage = new FormData();
        fdTicketImage.append("file", blobTicketImage); 
        //fd.append("canvasImage", blob);
        const pinataApiKey = EnvConstant.pinataHeader.headers.pinata_api_key;
        const pinataSecretApiKey = EnvConstant.pinataHeader.headers.pinata_secret_api_key;
        const urlTicketImage = EnvConstant.pinataURL + "/pinFileToIPFS";
        var pinataTicketImage = await axios.post(urlTicketImage, fdTicketImage, {
          headers: {
            "Content-Type": `multipart/form-data; boundary= ${fdTicketImage._boundary}`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        });

        // Create data for IPFS
        var data = {
          "name": eventName + "; " + ticketCategoryNameForDialog + "; ID#" + tokenId,
          "description": "Event name:" + eventName + "; Ticket category: " + ticketCategoryNameForDialog + "; ID#" + tokenId,
          "image": "ipfs://ipfs/" + pinataTicketImage.data.IpfsHash,
          "external_url":"https://ropsten.rarible.com/token/" + EnvConstant.contractAddress + ":" + tokenId,
          "attributes":[]
        };

        // Add to pinata
        const url = EnvConstant.pinataURL + "/pinJSONToIPFS";
        const pinataIPFS = await axios.post(url, data, EnvConstant.pinataHeader);

        // Create lazy mint order
        const lazyMintOrder = {
          "@type": "ERC721",
          contract: EnvConstant.contractAddress,
          tokenId: tokenId,
          tokenURI: "/ipfs/" + pinataIPFS.data.IpfsHash,
          uri: "/ipfs/" + pinataIPFS.data.IpfsHash,
          creators: [{ account: creator, value: "10000" }],
          royalties: []
        }
        
        await signAndPutLazyMint(lazyMintOrder);

        tokensId.push(tokenId);
      }
      
      const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, Provider);
      const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
      var _ticketCategoryPrice = parseFloat(ticketCategoryPriceForDialog) * parseInt(totalNumberOfTickets);
      let overrides = {
          // To convert Ether to Wei:
          value: ethers.utils.parseEther(_ticketCategoryPrice.toString()) // ether in this case MUST be a string
      };
      const tx = await nftTicketizeContractWithSigner.fillInformationsAboutTicket(
        eventKey,
        ticketCategoryKeyForDialog,
        tokensId,
        overrides
      );

      const receipt = await tx.wait();
      console.log('Minting Success', receipt);
      onSetSnackBarMessage("You are success buy " + totalNumberOfTickets + " tickets", "success");
      onReloadList(true);
      onSetOverlay(false);
    } catch (err) {  
      console.log(err);
      onReloadList(true);
      onSetOverlay(false);
    };
  }

  return (<Dialog open={buyDialogOpen} onClose={() => buyDialogHandleClose()} aria-labelledby="form-dialog-title">
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


function ButtonsBox({onReloadList, onSetOverlay, onSetSnackBarMessage}) {
  
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

    if (resellFeeValue < 0 || resellFeeValue > 50) {
      setResellFeeValueValidation(false);
      return;
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


function EventDetailInner() {
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
          <ButtonsBox onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} onSetSnackBarMessage = {setSnackBarMessage}>
          </ButtonsBox>
          <TicketCategoryDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} onSetSnackBarMessage={setSnackBarMessage}>
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
          <TicketCategoryDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
          </TicketCategoryDetail>
        </div>
      </LoadingOverlay>
    );
  }
}

export default function EventDetail(props) {
  useEffect(() => {
    const createIPFSRef = async () => {
      ipfs = await CreateIPFSRef();
    }
    createIPFSRef();
  }, [ipfs]);

  return (
    <SnackbarProvider maxSnack={3}>
      <EventDetailInner/>
    </SnackbarProvider>
  );
}