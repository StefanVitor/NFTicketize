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
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import { Magic } from "magic-sdk";
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { ZilliqaExtension } from "@magic-ext/zilliqa";
import { EnvConstant} from ".././const";
import { BN, Long, bytes, units} from '@zilliqa-js/util';
import Async from 'react-async';
import { firebase } from '@firebase/app';
import { useLocation } from "react-router-dom";
import LoadingOverlay from 'react-loading-overlay';
import '@firebase/database';

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

// Magic initialization
const magic = new Magic(EnvConstant.magicPrivateKey, {
  extensions: {
      zilliqa: new ZilliqaExtension({
      rpcUrl: 'https://dev-api.zilliqa.com' 
      })
  }
});

// Zilliqa and smart contract initialization
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
const deployedContract = zilliqa.contracts.at(EnvConstant.contractAddress);

// Function to compare (order) post per created date
const comparePosts = function( a, b ) {
  if ( b.created_date < a.created_date ){
    return -1;
  }
  if ( b.created_date > a.created_date ){
    return 1;
  }
  return 0;
};

// Firebase initialization
if (!firebase.apps.length) {
  firebase.initializeApp(EnvConstant.firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}
const dbRef = firebase.database().ref();

function TierDetail({onReloadList, onSetOverlay}) {  
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
  const projectKey = location.state.projectKey;
  const myProject = location.state.myProject;

  const getProjectTiers = async () => {
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
          if (csTiersProject.tier_ids_project[tierKey] === projectKey){
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
            if (myProject === "true") {
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
    }
  }

  // Get tier detail from database
  const getTierDetail = async(tierKey) =>  {
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
    });
  }

  // Get token detail from database
  const getTokenDetail = async(tokenKey) =>  {
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
    });
}

  const getPostsFromProject = async () => {
    try {
      var data = []; 
      // Mapping between token id and tier id
      var csTokensTierId = await deployedContract.getSubState('tokens_tier_id');
      // Mapping between token id and token owner (address)
      var csTokensOwner = await deployedContract.getSubState('tokens_owner');
      var wallet = await magic.zilliqa.getWallet();
      return dbRef.child("posts").child(projectKey).get().then((snapshot) => {
        if (snapshot.exists()) {
          var obj = snapshot.val();
          for (var key in obj) {
             // If logged user owns that project
            if (myProject === "true") {
              data.push(obj[key]); 
            } else {
              var foundTier = false;
              for (var tierKey in obj[key]["post_tiers"]) {
                if (foundTier === false) { 
                  for(var tokenKey in csTokensTierId.tokens_tier_id) {
                    if (csTokensTierId.tokens_tier_id[tokenKey] === tierKey 
                      && csTokensOwner.tokens_owner[tokenKey].toLowerCase() === wallet.address.toLowerCase()) {
                        data.push(obj[key]); 
                        foundTier = true;
                    }
                  }
                }
              }
            }
          }
          data.sort( comparePosts );
          return data;
        } else {
          return data;
        }
      }).catch((error) => {
        console.error(error);
        return data;
      });
    } catch (err) {  
      console.log(err);
      return data;
    };
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

          if (isGasSufficient && location.state.projectKey)
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
    };
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
    };
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
    };
  }

  // Dialog for burn - open
  const burnDialogHandleOpen = (tokenKey, tierName) =>  {
    setTokenForDialog(tokenKey);
    setTierNameForDialog(tierName);
    setBurnDialogOpen(true);
  };

  // Dialog for burn - close
  const burnDialogHandleClose = () => {
    setTokenForDialog(-1)
    setTierNameForDialog("");
    setBurnDialogOpen(false);
  };

  // Dialog for burn - burn button
  const burnDialogHandle = async() => {
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

          // Call transition for burn expired token on smart contract
          const result = await magic.zilliqa.callContract(
            'BurnExpiredToken', args, params, 33, 1000, false, EnvConstant.contractAddress
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
    };
  }

  const classes = useStyles();

  return (<div>
    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'left', alignItems:'center'}}>
        <h5>Tiers</h5>
      </div>
    </Box>
    <Async promiseFn={getProjectTiers}>
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
                        #Price {units.fromQa(new BN(tier.price), units.Units.Zil)} ZIL
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
                          <Box component="div" visibility={tier.has_expired === true? "visible" : "hidden"}>
                            <Button onClick={() => { burnDialogHandleOpen(tier.token_key, tier.name)}} size="small" >Burn (destroy)</Button>
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

      <Box m={2} pt={1}>
        <div style={{display: 'flex',  justifyContent:'left', alignItems:'center', padding:"5"}}>
          <h5>Posts</h5>
        </div>
      </Box>
      </Async>
      <Async promiseFn={getPostsFromProject}>
        <Async.Loading>Loading...</Async.Loading>
        <Async.Fulfilled>
          {data => {
          return (
            <Grid container spacing={3} direction='column'>
              {data.map(post=> (
                <Grid item xs>
                      <Card className={classes.root}>
                        <CardContent>
                          <Typography variant="h5" component="h2">
                          {post.name}
                          <br />
                          <br />
                          </Typography>  
                          <Typography variant="body2" component="p">
                          {post.description.split("\n").map((i, key) => {
                            return <p key={key}>{i}</p> ;
                          })}
                          <br />
                          </Typography>
                          <Typography variant="body2" component="p" color="textSecondary">
                          #Created time {new Date(post.created_date).toLocaleString() }
                          <br />
                          </Typography>
                        </CardContent>
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

function ButtonsBox({onReloadList, onSetOverlay}) {
  
  //cnt => Create New Tier
  //cnp => Create New Post
  const [cntOpen, setcntOpen] = React.useState(false);
  const [cntName, setcntName] = React.useState("");
  const [cntNameValidation, setcntNameValidation] = React.useState(false);
  const [cntDesc, setcntDesc] = React.useState("");
  const [cntDescValidation, setcntDescValidation] = React.useState(false);
  const [cntLimitedUnlimited, setcntLimitedUnlimited] = React.useState("unlimited");
  const [cntMaxSubscriber, setcntMaxSubscriber] = React.useState(-1);
  const [cntLimitedTokensDisabled, setcntLimitedTokensDisabled] = React.useState(true);
  const [cntTimeLimit, setcntTimeLimit] = React.useState(1);
  const [cntPrice, setcntPrice] = React.useState(0);
  const [cntPriceValidation, setcntPriceValidation] = React.useState(false);
  const [cntResellFeeType, setResellFeeType] = React.useState("1");
  const [cntResellFeeValue, setcntResellFeeValue] = React.useState(0);
  const [cntResellFeeValueValidation, setcntResellFeeValueValidation] = React.useState(false);

  const [cnpOpen, setcnpOpen] = React.useState(false);
  const [cnpName, setcnpName] = React.useState("");
  const [cnpNameValidation, setcnpNameValidation] = React.useState(false);
  const [cnpDesc, setcnpDesc] = React.useState("");
  const [cnpDescValidation, setcnpDescValidation] = React.useState(false);
  const [cnpActiveCheckboxes, setCnpActiveCheckboxes] = React.useState([]);

  let location = useLocation();
  const projectKey = location.state.projectKey;
  const classes = useStyles();

  // Get tiers from chosen project
  const getTiersFromProject = async () => {
    try {
      // Mapping between tier id and project id
      var contractState = await deployedContract.getSubState('tier_ids_project');
      var data = [];
      if (contractState.tier_ids_project) {
        for(var key in contractState.tier_ids_project){
          // Get tiers from chosen project
          if (contractState.tier_ids_project[key].toLowerCase() === projectKey) {
            var tierDetail = await getTierDetail(key);
            if (tierDetail) {
              data.push(tierDetail);
            }
          }
        }
      }
      return data;
    } catch (err) {  
      console.log(err);
      return [];
    }
  }

  // Get tier detail from database
  const getTierDetail = async(tierKey) =>  {
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
    });
  }

  // Create new tier button
  const createNewTier = async (tierName, tierDesc, tierLimitedUnlimited, tierMaxSubscriber,
    tierTimeLimit, tierPrice, tierResellType, tierResellValue) => {
    try {
      onSetOverlay(true);
      const myGasPrice = units.toQa(EnvConstant.gasPrice, units.Units.Li); 
      const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
      const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); 

      if (isGasSufficient && location.state.projectKey)
      {
        const VERSION = bytes.pack(EnvConstant.chainId, EnvConstant.msgVersion);
        const params = {
          // amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(8000),
        };
        var maxSubscriber = "-1";
        if (tierLimitedUnlimited === "limited") {
          maxSubscriber = tierMaxSubscriber;
        }
        var tierPriceInQa = new BN(units.toQa(tierPrice, units.Units.Zil)).toNumber(); 
        const args = [{
            vname: 'project_id',
            type: 'Uint256',
            value: location.state.projectKey,
          }, {
            vname: 'max_subscriber',
            type: 'Int32',
            value: maxSubscriber,
          },{
            vname: 'time_limit',
            type: 'Uint32',
            value: tierTimeLimit.toString(),
          },{
            vname: 'price',
            type: 'Uint128',
            value: tierPriceInQa.toString(),
          },{
            vname: 'resell_type',
            type: 'Uint32',
            value: tierResellType,
          },{
            vname: 'resell_value',
            type: 'Uint128',
            value: tierResellValue,
          }
        ];

        // Call transition for create new tier on smart contract
        const result = await magic.zilliqa.callContract(
          'CreateTierOnProject', args, params, 33, 1000, false, EnvConstant.contractAddress
        );

        if (result)
        {
          if (result.receipt)
          {
            if (result.receipt.success)
            {
              const paramsResult = result.receipt.event_logs[0].params;
              if (paramsResult[0].vname === "tier_id")
              {
                // If transition is success, create new tier on database
                var tierId = paramsResult[0].value;
                firebase.database().ref('tiers/' + tierId).set({
                  name: tierName,
                  description: tierDesc,
                  limited_unlimited: tierLimitedUnlimited,
                  max_subscriber: tierMaxSubscriber,
                  time_limit: tierTimeLimit,
                  price: tierPrice,
                  resell_type: tierResellType,
                  resell_value: tierResellValue
                });

                onReloadList(true);
                onSetOverlay(false);
                return;
              }
            }
          }
        }
      }
      onSetOverlay(false);
    } catch (err) { 
      onSetOverlay(false);
      console.log(err);
    }
  }

  // Create new post on database
  const createNewPost = async (postName, postDesc) => {
    try {
      onSetOverlay(true);

      var obj = {};
      for (var key in cnpActiveCheckboxes) {
        if (cnpActiveCheckboxes[key] === true) {
          obj[key] = true;
        }
      }
      await firebase.database().ref('posts/' + projectKey).push({
        name: postName,
        description: postDesc,
        created_date: firebase.database.ServerValue.TIMESTAMP,
        post_tiers: obj
      });      

      onReloadList(true);
      onSetOverlay(false);
    }
    catch (err) { 
      onSetOverlay(false);
      console.log(err);
    }
  }

  // On open create new tier
  const handleClickcnt = () => {
    setcntOpen(true);
  };

  // On close create new tier
  const handleClosecnt = () => {
    setcntOpen(false);
  };

  // On open create new post
  const handleClickcnp = () => {
    setCnpActiveCheckboxes([]);
    setcnpOpen(true);
  };

  // On close create new post
  const handleClosecnp = () => {
    setcnpOpen(false);
  };

  // Change value on create new tier (limited / unlimited number of tokens)
  const handleChangeLimitedUnlimited = (event) => {
    setcntLimitedUnlimited(event.target.value);
    if (event.target.value === "unlimited") {
      setcntLimitedTokensDisabled(true);
    } else {
      setcntLimitedTokensDisabled(false);
    }
  }

  const handleChangeResellFeeType = (event) => {
    setResellFeeType(event.target.value);
  }

  const handleChangeTimeLimit = (event) => {
    setcntTimeLimit(event.target.value);
  }
  
  // On check tiers when create new post
  const handleTierCheckboxChange = (key, value) => {
    var tempCnpActiveCheckboxex = cnpActiveCheckboxes;
    tempCnpActiveCheckboxex[key] = value;
    setCnpActiveCheckboxes(tempCnpActiveCheckboxex);
  }

  // On create new tier button dialog button
  const handleCreteNewTier = () => {
    // Validation for name
    if (!cntName) {
      setcntNameValidation(true);
      return;
    } else {
      setcntNameValidation(false);
    }

    // validation for description
    if (!cntDesc) {
      setcntDescValidation(true);
      return;
    } else {
      setcntDescValidation(false);
    }

    // validation for price
    if (!cntPrice === 0) {
      setcntPriceValidation(true);
      return;
    } else {
      setcntPriceValidation(false);
    }

    if (!cntResellFeeValue) {
      setcntResellFeeValue(0);
    }

    // Call create new tier procedure
    createNewTier(cntName, cntDesc, cntLimitedUnlimited, cntMaxSubscriber,
      cntTimeLimit, cntPrice, cntResellFeeType, cntResellFeeValue);
    setcntOpen(false);
  };

  // On create new post dialog button
  const handlecnp = () => {
    // Validation for name
    if (!cnpName) {
      setcnpNameValidation(true);
      return;
    }else {
      setcnpNameValidation(false);
    }

    // Validation for description
    if (!cnpDesc) {
      setcnpDescValidation(true);
      return;
    } else {
      setcnpDescValidation(false);
    }

    // Create new post button
    createNewPost(cnpName, cnpDesc);
    setcnpOpen(false);
  };

    return (
      <div>
        <div>
          <Box m={2} pt={1}>
            <Button variant="outlined" color="primary" onClick={handleClickcnt}>
              New Tier
            </Button>
            &nbsp;&nbsp;&nbsp; 
            <Button variant="outlined" color="primary" onClick={handleClickcnp}>
              New Post
            </Button>
          </Box>
          <Dialog open={cntOpen} validate onClose={handleClosecnt} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">New Tier</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="tier_name"
                label="Tier name"
                required
                fullWidth
                onChange={event => {
                  setcntName(event.target.value);
                }}
                error={cntNameValidation}
              />
              <TextField
                margin="dense"
                id="tier_description"
                label="Tier description"
                required
                multiline
                rows={4}
                fullWidth
                onChange={event => {
                  setcntDesc(event.target.value);
                }}
                error={cntDescValidation}
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">Total number of tokens(max subscriber)?</FormLabel>
                <RadioGroup aria-label="Limited/Unlimited" name="limited_unlimited" value={cntLimitedUnlimited} onChange={handleChangeLimitedUnlimited}>
                  <FormControlLabel value="unlimited" control={<Radio />} label="Unlimited" />
                  <FormControlLabel value="limited" control={<Radio />} label="Limited" />
                </RadioGroup>
              </FormControl>
              <TextField
                autoFocus
                margin="dense"
                id="tier_total_number"
                label="Total number of limited tokens(max subscriber)?"
                fullWidth
                onChange={event => {
                  setcntMaxSubscriber(event.target.value);
                }}
                type="number"
                disabled={cntLimitedTokensDisabled}
                min="1"
              />
              <FormControl className={classes.labelFormControl}>
                <InputLabel id="select-tier-time-limit">Tier Time Limit</InputLabel>
                <Select
                  labelId="select-tier-time-limit"
                  id="tier_time_limit"
                  value={cntTimeLimit}
                  onChange={handleChangeTimeLimit}
                  >
                  <MenuItem value={4}>Minute</MenuItem>
                  <MenuItem value={1}>Week</MenuItem>
                  <MenuItem value={2}>Month</MenuItem>
                  <MenuItem value={3}>Lifetime</MenuItem>
                </Select>
              </FormControl>
              <TextField
                autoFocus
                margin="dense"
                id="tier_price"
                label="Tier price (in ZIL)"
                required
                fullWidth
                onChange={event => {
                  setcntPrice(event.target.value);
                }}
                type="number"
                error={cntPriceValidation}
                min="0"
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">Resell fee for project owner - type</FormLabel>
                <RadioGroup aria-label="ResellFeeType" name="resell_fee_type" value={cntResellFeeType} onChange={handleChangeResellFeeType}>
                  <FormControlLabel value="1" control={<Radio />} label="Percent" />
                  <FormControlLabel value="2" control={<Radio />} label="Fixed" />
                </RadioGroup>
              </FormControl>
              <TextField
                autoFocus
                margin="dense"
                id="resell_fee_value"
                label="Resell fee for project owner - value"
                required
                fullWidth
                onChange={event => {
                  setcntResellFeeValue(event.target.value);
                }}
                type="number"
                error={cntResellFeeValueValidation}
                min="0"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosecnt} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreteNewTier} color="primary">
                Create New
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={cnpOpen} validate onClose={handleClosecnp} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">New Post</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="post_name"
                label="Post name"
                required
                fullWidth
                onChange={event => {
                  setcnpName(event.target.value);
                }}
                error={cnpNameValidation}
              />
              <TextField
                margin="dense"
                id="post_nema"
                label="Post description"
                required
                multiline
                rows={6}
                fullWidth
                onChange={event => {
                  setcnpDesc(event.target.value);
                }}
                error={cnpDescValidation}
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">Pick tiers to display post</FormLabel>
                <FormGroup row={false}>
                  <Async promiseFn={getTiersFromProject}>
                    <Async.Loading>Loading...</Async.Loading>
                    <Async.Fulfilled>
                      {data => {
                      return (
                        <div>
                          {data.map(tier=> (
                            <FormControlLabel
                              control={<Checkbox checked={cnpActiveCheckboxes[tier.key]} onChange={(e)=> {handleTierCheckboxChange(tier.key, e.target.checked)}} name={tier.key} />}
                              label={tier.name}
                            />
                          ))}
                        </div>
                      )
                    }}
                      
                    </Async.Fulfilled>
                    <Async.Rejected>
                      {error => `Something went wrong: ${error.message}`}
                    </Async.Rejected>
                  </Async>
                </FormGroup>
              </FormControl>

            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosecnp} color="primary">
                Cancel
              </Button>
              <Button onClick={handlecnp} color="primary">
                Create New Post
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
}


function ProjectDetail() {
  const [reloadList, setReloadList] = React.useState(false);
  const [isActiveOverlay, setIsActiveOverlay] = React.useState(false);

  const reloadListFunc = () => {
    setReloadList(true);
  }

  const setOverlayFunc = (value) => {
    setIsActiveOverlay(value);
  }

  useEffect(() => {
    setReloadList(false);
  }, [reloadList]);

  let location = useLocation();
  const myProject = location.state.myProject;
  const projectName = location.state.projectName;
  if (myProject === "true") {
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
                <h4>Project "{projectName}" detail</h4>
            </div>
          </Box>
          <ButtonsBox onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
          </ButtonsBox>
          <TierDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
          </TierDetail>
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
                <h4>Project "{projectName}" detail</h4>
            </div>
          </Box>
          <TierDetail onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
          </TierDetail>
        </div>
      </LoadingOverlay>
    );
  }
}

export default ProjectDetail;