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
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { EnvConstant} from ".././const";
import Async from 'react-async';
import { useLocation } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { ethers } from "ethers";
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';
import { SnackbarProvider, useSnackbar } from 'notistack';

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
    minWidth: 120,
  },
}));

// Ethers.js initialization
const provider = new ethers.providers.Web3Provider(window.ethereum); 
const NFTicketizeContractArt = require( "../contracts/NFTicketize.json");

// IPFS initialization
const IPFS = require('ipfs-core');
let ipfs = null;

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

function TicketCategoryDetail({onReloadList, onSetOverlay}) {  
  const [buyDialogOpen, setBuyDialogOpen] = React.useState(false);
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const [cancelSellDialogOpen, setCancelSellDialogOpen] = React.useState(false);
  const [burnDialogOpen, setBurnDialogOpen] = React.useState(false);
  const [tierForDialog, setTierForDialog] = React.useState(-1);
  const [tokenForDialog, setTokenForDialog] =  React.useState(-1);
  const [tierNameForDialog, setTierNameForDialog] = React.useState("");
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
        resellTicketType
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
        data.push({
          key: parseInt(ticketCategories[counter].id),
          price: ticketCategories[counter].ticketPrice,
          sold_tickets: 0,
          max_tickets: ticketCategories[counter].maxTickets,
          resell_ticket_type: ticketCategories[counter].resellTicketType,
          resell_ticket_value: ticketCategories[counter].resellTicketValue,
          name: ipfsData.name,
          description: ipfsData.description,
          buy_button: true,
          sell_button: true,
          cancel_sell_button: true
        });
      }
      ipfs.stop().catch(err => console.error(err));
      ipfs = null;
      return data;
    }
    return [];
  }

  // Get tier detail from database
  const getTicketCategoryDetail = async(tierKey) =>  {
    /*
    return dbRef.child("tiers").child(tierKey).get().then((snapshot) => {
      if (snapshot.exists()) {
        var obj = snapshot.val();
        obj.key = tierKey;
        return obj;
      } else {
        return null;
      }
    }).catch((error) => {
      console.error(error);
      return null;
    });*/

  }
  
  const getProjectTiers = async () => {
    /* 
    try {
      // Get current TX block number of the network
      const currentMiniEpoch = await zilliqa.blockchain.getCurrentMiniEpoch();
      // Mapping between tier id and project id
      var csTiersProject = await deployedContract.getSubState('tier_ids_project');
      // Mapping between token id and token owner(address)
      var csTokensOwners = await deployedContract.getSubState('tokens_owner');
      // Mapping between token id and tier id
      var csTokensTierId = await deployedContract.getSubState('tokens_tier_id');
      // Mapping between token id and sell price
      var csTokensSellPrice = await deployedContract.getSubState('tokens_sell_price');
      // Mapping between tier id and subscriber count
      var csTiersSubscriberCount = await deployedContract.getSubState('tier_ids_subscriber_count');
      // Mapping between tier id and tier price
      var csTiersPrice = await deployedContract.getSubState('tier_ids_price');
      // Mapping between token id and time limit
      var csTokensTimeLimit = await deployedContract.getSubState('tokens_time_limit');
      var wallet = await magic.zilliqa.getWallet();
      var data = [];
      if (csTiersProject.tier_ids_project) {
        for(var tierKey in csTiersProject.tier_ids_project){
          // Get tiers for chosen project
          if (csTiersProject.tier_ids_project[tierKey] === eventKey){
            var tierDetail = await getTierDetail(tierKey);
            var subscriberCount = csTiersSubscriberCount.tier_ids_subscriber_count[tierKey];
            if (subscriberCount) {
              tierDetail.subscriber_count = subscriberCount; 
            } else {
              tierDetail.subscriber_count = 0;
            }
            tierDetail.price = csTiersPrice.tier_ids_price[tierKey];

            tierDetail.sell_button = false;
            tierDetail.cancel_sell_button = false;
            tierDetail.has_expired_label = false;
            tierDetail.has_expired = false;
            tierDetail.token_key = -1;
            // If logged user owns that project
            if (myEvent === "true") {
              tierDetail.buy_button = false;
            } else {
              tierDetail.buy_button = true;

              if (tierDetail) {
                for (var token_key in csTokensTierId.tokens_tier_id) {
                  if (csTokensTierId.tokens_tier_id[token_key] === tierKey 
                    && csTokensOwners.tokens_owner[token_key].toLowerCase() === wallet.address.toLowerCase()) {
                    tierDetail.has_expired_label = true;
                    tierDetail.token_key = token_key;
                    var tokensTimeLimit = csTokensTimeLimit.tokens_time_limit[token_key];
                    if (tokensTimeLimit) {
                      if (parseInt(currentMiniEpoch.result) > parseInt(tokensTimeLimit)) {
                        tierDetail.has_expired = true;
                      }
                    }

                    // Get token details 
                    var tokenDetail = await getTokenDetail(token_key);
                    if (tokenDetail) {
                      if (tierDetail.time_limit === 1) {
                        tierDetail.expired = new Date(tokenDetail.created_date);
                        tierDetail.expired.setHours(tierDetail.expired.getHours() + 168);
                        tierDetail.expired = tierDetail.expired.toLocaleString();
                      } else if (tierDetail.time_limit === 2) {
                        tierDetail.expired = new Date(tokenDetail.created_date);
                        tierDetail.expired.setMonth(tierDetail.expired.getMonth() + 1);
                        tierDetail.expired = tierDetail.expired.toLocaleString();
                      } else  if (tierDetail.time_limit === 3) {
                        tierDetail.expired = "Lifetime";
                      } else  if (tierDetail.time_limit === 4) {
                        tierDetail.expired = new Date(tokenDetail.created_date);
                        tierDetail.expired.setMinutes(tierDetail.expired.getMinutes() + 1);
                        tierDetail.expired = tierDetail.expired.toLocaleString();
                      }
                    } else {
                      tierDetail.expired = "Lifetime";
                    }

                    // If token hasn't expired, set buttons for buy, sell and cancel sell
                    if (tierDetail.has_expired === false) {
                      tierDetail.buy_button = false;
                      tierDetail.sell_button = true;
                      tierDetail.cancel_sell_button = true;
                      if (csTokensSellPrice.tokens_sell_price[token_key]) {
                        tierDetail.sell_button = false;
                      } else {
                        tierDetail.cancel_sell_button = false;
                      }
                    } else {
                      tierDetail.buy_button = false;
                      tierDetail.sell_button = false;
                      tierDetail.cancel_sell_button = false;
                    }
                  }
                }
              }
            }
            data.push(tierDetail);
          }
        }
      }
      return data;
    } catch (err) {  
      console.log(err);
      return [];
    }*/
    return [];
  }

  // Get tier detail from database
  const getTierDetail = async(tierKey) =>  {
    /*
    return dbRef.child("tiers").child(tierKey).get().then((snapshot) => {
      if (snapshot.exists()) {
        var obj = snapshot.val();
        obj.tier_id = tierKey;
        return obj;
      } else {
        return null;
      }
    }).catch((error) => {
      console.error(error);
      return null;
    });*/
    return null;
  }

  // Get token detail from database
  const getTokenDetail = async(tokenKey) =>  {
    /*
    return dbRef.child("tokens").child(tokenKey).get().then((snapshot) => {
      if (snapshot.exists()) {
        var obj = snapshot.val();
        return obj;
      } else {
        return null;
      }
    }).catch((error) => {
      console.error(error);
      return null;
    });*/
    return null;
}

  // Dialog for buy button - open
  const buyDialogHandleOpen = (tierKey, tierName) =>  {
    setTierForDialog(tierKey);
    setTierNameForDialog(tierName);
    setBuyDialogOpen(true);
  }

  // Dialog for buy button - close
  const buyDialogHandleClose = () => {
    setTierForDialog(-1)
    setTierNameForDialog("");
    setBuyDialogOpen(false);
  };

  // Dialog for buy button - buy
  const buyDialogHandleBuy = async() => {
    /*
    setBuyDialogOpen(false);
    onSetOverlay(true);
    try {
      // Mapping between tier id and tier price
      var csTiersPrice = await deployedContract.getSubState('tier_ids_price');
      var tierPrice = csTiersPrice.tier_ids_price[tierForDialog];
      if (tierPrice) {
        const publicAddress = (await magic.zilliqa.getWallet()).bech32Address;
        const balanceResult = await zilliqa.blockchain.getBalance(publicAddress);
        const balance = balanceResult.result.balance;
        //You can buy tier
        if (parseInt(balance) >= parseInt(tierPrice)) {
          const myGasPrice = units.toQa(EnvConstant.gasPrice, units.Units.Li); 
          const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
          const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); 

          if (isGasSufficient && location.state.eventKey)
          {
            const VERSION = bytes.pack(EnvConstant.chainId, EnvConstant.msgVersion);
            const params = {
              // amount, gasPrice and gasLimit must be explicitly provided
              version: VERSION,
              amount: tierPrice,
              gasPrice: myGasPrice,
              gasLimit: Long.fromNumber(8000),
            };

            const args = [{
                vname: 'tier_id',
                type: 'Uint256',
                value: tierForDialog,
              }
            ];

            // Call transition on smart contract for buy new token
            const result = await magic.zilliqa.callContract(
              'BuyNewToken', args, params, 33, 1000, false, EnvConstant.contractAddress
            );

            if (result){
              if (result.receipt){
                if (result.receipt.success){
                  const paramsResult = result.receipt.event_logs[0].params;
                  if (paramsResult[0].vname === "token_id")
                  {
                    // If transition is sucess, add token on database
                    var tokenId = paramsResult[0].value;
                    firebase.database().ref('tokens/' + tokenId).set({
                      created_date: firebase.database.ServerValue.TIMESTAMP
                    });
                  }
                }
              }
            }
          }
        }
      }
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (err) {  
      console.log(err);
      onReloadList(true);
      onSetOverlay(false);
    };*/
  }

  // Dialog for sell button - open
  const sellDialogHandleOpen = (tokenKey, tierName) =>  {
    setTokenForDialog(tokenKey);
    setTierNameForDialog(tierName);
    setSellDialogOpen(true);
  }

  // Dialog for sell button - close
  const sellDialogHandleClose = () => {
    setTokenForDialog(-1)
    setTierNameForDialog("");
    setSellDialogOpen(false);
  };

  // Dialog for sell button - on sell click
  const sellDialogHandleSell  = async() => {
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
          var priceForSellInQa = new BN(units.toQa(priceForSell, units.Units.Zil)).toNumber(); 
          const args = [{
              vname: 'token_id',
              type: 'Uint256',
              value: tokenId,
            }, {
              vname: 'price_for_sell',
              type: 'Uint128',
              value: priceForSellInQa.toString(),
            }
          ];

          const result = await magic.zilliqa.callContract(
            'SetTokenForSell', args, params, 33, 1000, false, EnvConstant.contractAddress
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
    }; */
  }

  // Dialog for cancel sell - open
  const cancelSellDialogHandleOpen = (tokenKey, tierName) =>  {
    setTokenForDialog(tokenKey);
    setTierNameForDialog(tierName);
    setCancelSellDialogOpen(true);
  }
  
  // Dialog for cancel sell - close
  const cancelSellDialogHandleClose = () => {
    setTokenForDialog(-1);
    setTierNameForDialog("");
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
            {data.map(tier=> (
              <Grid item xs>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        {tier.name}
                        <br />
                        <br />
                        </Typography>  
                        <Typography variant="body2" component="p">
                        {tier.description.split("\n").map((i, key) => {
                          return <p key={key}>{i}</p> ;
                        })}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Price {tier.price} ZIL
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Subscribed {tier.subscriber_count}/{tier.max_subscriber === -1 ? "Unlimited" : tier.max_subscriber}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Time limit - {tier.time_limit === 1? "Week" : (tier.time_limit === 2? "Month" : (tier.time_limit === 3? "Lifetime" : "Minute"))}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Resell fee (type) - {tier.resell_type === 1? "Percent" : "Fixed"}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Resell fee (value) - {tier.resell_value} {tier.resell_type === 1? "%" : " ZIL "}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        {tier.has_expired_label === true ? ("#Expired " + tier.expired) : ""}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Box component="div" visibility={tier.buy_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyDialogHandleOpen(tier.tier_id, tier.name)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={tier.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(tier.token_key, tier.name)}} size="small" >Sell</Button>
                          </Box>
                          <Box component="div" visibility={tier.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(tier.token_key, tier.name)}} size="small" >Cancel sell</Button>
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
      <DialogTitle id="form-dialog-title">Buy tier</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to buy tier "{tierNameForDialog}"?
        </DialogContentText>
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
          Do you want to sell tier "{tierNameForDialog}"?
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
          Do you want to cancel sell tier "{tierNameForDialog}"?
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

    <Dialog open={burnDialogOpen} onClose={() => burnDialogHandleClose()} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Burn token</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to burn token for tier "{tierNameForDialog}"?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => burnDialogHandleClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={() => burnDialogHandle()} color="primary">
          Burn token
        </Button>
      </DialogActions>
    </Dialog>
  </div>);
}

function ButtonsBox({onReloadList, onSetOverlay, onSetSnackBarMessage}) {
  
  const [open, setOpen] = React.useState(false);
  const [categoryName, setCategoryName] = React.useState("");
  const [categoryNameValidation, setCategoryNameValidation] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [descriptionValidation, setDescriptionValidation] = React.useState(false);
  const [limitedUnlimited, setLimitedUnlimited] = React.useState("unlimited");
  const [maxSubscriber, setMaxSubscriber] = React.useState(-1);
  const [limitedTokensDisabled, setLimitedTokensDisabled] = React.useState(true);
  const [price, setPrice] = React.useState(0);
  const [priceValidation, setPriceValidation] = React.useState(false);
  const [resellFeeType, setResellFeeType] = React.useState("1");
  const [resellFeeValue, setResellFeeValue] = React.useState(0);
  const [resellFeeValueValidation, setResellFeeValueValidation] = React.useState(false);

  let location = useLocation();
  const eventKey = location.state.eventKey;

  // Create new tier button
  const createNewTicketCategory = async (eventKey, categoryName, description, limitedUnlimited, maxSubscriber,
    price, resellFeeType, resellFeeValue) => {

    const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, provider);

    //Insert into IPFS
    if (ipfs == null) {
      ipfs = await IPFS.create();
    }
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
      var _maxSubscriber = 0;
      if (limitedUnlimited === "limited") {
        _maxSubscriber = maxSubscriber;
      }
      var _parsePrice = ethers.utils.parseUnits(price, "gwei");
      var _resellFeeType = parseInt(resellFeeType);
      var _resellFeeValue = parseInt(resellFeeValue);
      await nftTicketizeContractWithSigner.createTicketCategory(_eventKey, _maxSubscriber, _parsePrice, _resellFeeType, _resellFeeValue, cid.string);
      await ipfs.pin.add(cid.string);
      onSetSnackBarMessage("Event is success created", "success");
      setOpen(false);
    }
    catch (error) {
      onSetSnackBarMessage(error.message, "error");
    }
    ipfs.stop().catch(err => console.error(err));
    ipfs = null;
  }

  // On open create new event category
  const handleClick = () => {
    setOpen(true);
  };

  // On close create new event category
  const handleClose = () => {
    setOpen(false);
  };


  // Change value on create new event category (limited / unlimited number of tokens)
  const handleChangeLimitedUnlimited = (event) => {
    setLimitedUnlimited(event.target.value);
    if (event.target.value === "unlimited") {
      setLimitedTokensDisabled(true);
    } else {
      setLimitedTokensDisabled(false);
    }
  }

  const handleChangeResellFeeType = (event) => {
    setResellFeeType(event.target.value);
  }

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
    createNewTicketCategory(eventKey, categoryName, description, limitedUnlimited, maxSubscriber,
      price, resellFeeType, resellFeeValue);
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Total number of tickets(max tokens)?</FormLabel>
                <RadioGroup aria-label="Limited/Unlimited" name="limited_unlimited" value={limitedUnlimited} onChange={handleChangeLimitedUnlimited}>
                  <FormControlLabel value="unlimited" control={<Radio />} label="Unlimited" />
                  <FormControlLabel value="limited" control={<Radio />} label="Limited" />
                </RadioGroup>
              </FormControl>
              <TextField
                autoFocus
                margin="dense"
                id="total_number"
                label="Total number of limited tokens(max subscriber)?"
                fullWidth
                onChange={event => {
                  setMaxSubscriber(event.target.value);
                }}
                type="number"
                disabled={limitedTokensDisabled}
                min="1"
              />
              <TextField
                autoFocus
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Resell fee for event owner - type</FormLabel>
                <RadioGroup aria-label="ResellFeeType" name="resell_fee_type" value={resellFeeType} onChange={handleChangeResellFeeType}>
                  <FormControlLabel value="1" control={<Radio />} label="Percent" />
                  <FormControlLabel value="2" control={<Radio />} label="Fixed" />
                </RadioGroup>
              </FormControl>
              <TextField
                autoFocus
                margin="dense"
                id="resell_fee_value"
                label="Resell fee for event owner - value"
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
          <TicketCategoryDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
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

export default function EventDetail() {
  return (
    <SnackbarProvider maxSnack={3}>
      <EventDetailInner />
    </SnackbarProvider>
  );
}