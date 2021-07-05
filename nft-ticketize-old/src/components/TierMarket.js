import React from 'react';
import Button from '@material-ui/core/Button';
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
import { Magic } from "magic-sdk";
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { ZilliqaExtension } from "@magic-ext/zilliqa";
import { EnvConstant} from ".././const";
import { BN, Long, bytes, units} from '@zilliqa-js/util';
import Async from 'react-async';
import { firebase } from '@firebase/app';
import LoadingOverlay from 'react-loading-overlay';
import { useHistory } from "react-router-dom";
import '@firebase/database';

// Styles template
const useStyles = makeStyles({
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
});

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

// Firebase initialization
if (!firebase.apps.length) {
  firebase.initializeApp(EnvConstant.firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}
const dbRef = firebase.database().ref();

function TierMarket() {
  let history = useHistory();

  const [isActiveOverlay, setIsActiveOverlay] = React.useState(false);
  const [tokensOnMarket, setTokensOnMarket] = React.useState("for_sell");
  const [buyDialogOpen, setBuyDialogOpen] = React.useState(false);
  const [cancelSellDialogOpen, setCancelSellDialogOpen] = React.useState(false);
  const [tokenForDialog, setTokenForDialog] = React.useState(-1);
  const [tierNameForDialog, setTierNameForDialog] = React.useState("");
    
  const classes = useStyles();

  // On change token type on market (for sell or for buy)
  const handleChangeTokensOnMarket = (event) => {
    setTokensOnMarket(event.target.value);
  };

  const onSetOverlay = (value) => {
    setIsActiveOverlay(value);
  };

  // Open dialog for buy token
  const buyDialogHandleOpen = (tierName, tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setTierNameForDialog(tierName);
    setBuyDialogOpen(true);
  };

  // Open dialog for sell token
  const buyDialogHandleClose = () => {
    setTokenForDialog(-1);
    setTierNameForDialog("");
    setBuyDialogOpen(false);
  };

  // Dialog buy click
  const buyDialogHandleBuy = async() => {
    setBuyDialogOpen(false);
    onSetOverlay(true);

    try {
      // Mapping between tier id and price
      var csTokensSellPrice = await deployedContract.getSubState('tokens_sell_price');
      var tokenPrice = csTokensSellPrice.tokens_sell_price[tokenForDialog];
      if (tokenPrice) {
        const publicAddress = (await magic.zilliqa.getWallet()).bech32Address; 
        const balanceResult = await zilliqa.blockchain.getBalance(publicAddress);
        const balance = balanceResult.result.balance;
        //You can buy tier
        if (parseInt(balance) >= parseInt(tokenPrice)) {
          const myGasPrice = units.toQa(EnvConstant.gasPrice, units.Units.Li); 
          const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
          const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); 

          // If has enough gas
          if (isGasSufficient)
          {
            const VERSION = bytes.pack(EnvConstant.chainId, EnvConstant.msgVersion);
            const params = {
              // amount, gasPrice and gasLimit must be explicitly provided
              version: VERSION,
              amount: tokenPrice,
              gasPrice: myGasPrice,
              gasLimit: Long.fromNumber(8000),
            };

            var tokenId = tokenForDialog;

            const args = [{
                vname: 'token_id',
                type: 'Uint256',
                value: tokenId,
              }
            ];

            // Call transition on smart contract
            const result = await magic.zilliqa.callContract(
              'SellToken', args, params, 33, 1000, false, EnvConstant.contractAddress
            );

            if (result){
              if (result.receipt){
                if (result.receipt.success){
                  onSetOverlay(false);
                  return;
                }
              }
            }
          }
        }
        
      } 
      onSetOverlay(false);
    }catch (err) {
      onSetOverlay(false);
    }
  }

  // On open cancel sell dialog
  const cancelSellDialogHandleOpen = (tierName, tokenKey) =>  {
    setTokenForDialog(tokenKey);
    setTierNameForDialog(tierName);
    setCancelSellDialogOpen(true);
  };

  // On close cancel sell dialog
  const cancelSellDialogHandleClose = () => {
    setTokenForDialog(-1);
    setTierNameForDialog("");
    setCancelSellDialogOpen(false);
  };

  // On cancel sell dialog
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

        if (tokenId) {
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
    };
  }

  // Go to project detail page
  const clickProjectDetail = (projectKey, projectName) =>  {
    history.push('/project_detail', {"projectKey": projectKey, "myProject": "false", "projectName": projectName});
  };

  // Get tokens (tiers) for market
  const getTokensForMarket = async () => {
    try {
      // Mapping between tier id and project id 
      var csTiersProject = await deployedContract.getSubState('tier_ids_project');
      // Mapping between token id and token owner (address)
      var csTokensOwners = await deployedContract.getSubState('tokens_owner');
      // Mapping between token id and tier id
      var csTokensTierId = await deployedContract.getSubState('tokens_tier_id');
      // Mapping between token id and token creator (address)
      var csTokensCreator = await deployedContract.getSubState('tokens_creator');
      // Mapping between token id and sell price
      var csTokensSellPrice = await deployedContract.getSubState('tokens_sell_price');
      // Mapping between tier id and subscriber count
      var csTiersSubscriberCount = await deployedContract.getSubState('tier_ids_subscriber_count');
      var wallet = await magic.zilliqa.getWallet();
      var data = [];
      if (csTokensSellPrice.tokens_sell_price) {
        for (var tokenId in csTokensSellPrice.tokens_sell_price) {
          var tokenOwner = csTokensOwners.tokens_owner[tokenId];
          // If radio button is "For sell" and token owner is logged user
          if (tokenOwner.toLowerCase() === wallet.address.toLowerCase() && tokensOnMarket === "for_sell") {
            var tierKey = csTokensTierId.tokens_tier_id[tokenId];
            var tierDetail = await getTierDetail(tierKey);
            tierDetail.price = csTokensSellPrice.tokens_sell_price[tokenId];

            // Get subscriber count
            var subscriberCount = csTiersSubscriberCount.tier_ids_subscriber_count[tierKey];
            if (subscriberCount) {
              tierDetail.subscriber_count = subscriberCount; 
            } else {
              tierDetail.subscriber_count = 0;
            }
  
            // Get project detail from database
            var projectKey = csTiersProject.tier_ids_project[tierKey];
            var projectDetail = await getProjectDetail(projectKey);
            tierDetail.project_key = projectKey;
            tierDetail.project_name = projectDetail.name;

            tierDetail.buy_button = false;
            tierDetail.cancel_sell_button = true;

            // Get token detail from database
            var tokenDetail = await getTokenDetail(tokenId);
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
            tierDetail.token_key = tokenId;
            data.push(tierDetail);
          } else if (tokensOnMarket === "for_buy") { // If radio button is "For buy"

            // If user has that tier, token for that tier does not appear on market list
            var tierKey = csTokensTierId.tokens_tier_id[tokenId];
            var hasThatTier = false;
            for (var innerTokenKey in csTokensTierId.tokens_tier_id) {
              if (csTokensTierId.tokens_tier_id[innerTokenKey] === tierKey) {
                if (csTokensOwners.tokens_owner[innerTokenKey].toLowerCase() === wallet.address.toLowerCase()) {
                  hasThatTier = true;
                  break;
                }
              }
            }

            // If logged user own project for that tier(token), it also does not apper on market list
            var isCreator = false;
            var tokenCreator = csTokensCreator.tokens_creator[tokenId];
            if (tokenCreator.toLowerCase() === wallet.address.toLowerCase()) {
              isCreator = true;
              break;
            }

            if (hasThatTier === false && isCreator === false) {
              var tierDetail = await getTierDetail(tierKey);
              tierDetail.price = csTokensSellPrice.tokens_sell_price[tokenId];

               // Get subscriber count
              var subscriberCount = csTiersSubscriberCount.tier_ids_subscriber_count[tierKey];
              if (subscriberCount) {
                tierDetail.subscriber_count = subscriberCount; 
              } else {
                tierDetail.subscriber_count = 0;
              }
    
               // Get project detail from database
              var projectKey = csTiersProject.tier_ids_project[tierKey];
              var projectDetail = await getProjectDetail(projectKey);
              tierDetail.project_key = projectKey;
              tierDetail.project_name = projectDetail.name;

              tierDetail.buy_button = true;
              tierDetail.cancel_sell_button = false;

              // Get token detail from database
              var tokenDetail = await getTokenDetail(tokenId);
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
              
              tierDetail.token_key = tokenId;
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

  // Get project detail from database
  const getProjectDetail = async(projectKey) =>  {
    return dbRef.child("projects").child(projectKey).get().then((snapshot) => {
      if (snapshot.exists()) {
        var obj = snapshot.val();
        obj.key = projectKey;
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

  return (
      <div>
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
          <Box m={2} pt={1}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
              <h4>Tier Market</h4>
            </div>
          </Box>
          <FormControl component="fieldset">
            <FormLabel component="legend">Tokens(tiers) type on market</FormLabel>
            <RadioGroup aria-label="Tokens on market" row  name="tokens_on_market" value={tokensOnMarket} onChange={handleChangeTokensOnMarket}>
              <FormControlLabel value="for_sell" control={<Radio />} label="For sell (my tiers)" />
              <FormControlLabel value="for_buy" control={<Radio />} label="For buy" />
            </RadioGroup>
          </FormControl>
          <Box m={2} pt={1}>
        <div style={{display: 'flex',  justifyContent:'left', alignItems:'center'}}>
          <h5>Tiers</h5>
        </div>
        </Box>

        <Async promiseFn={getTokensForMarket}>
          <Async.Loading>Loading...</Async.Loading>
          <Async.Fulfilled>
            {data => {
            return (
              <Grid container spacing={3} direction='column'>
                {data.map(tier=> (
                  <Grid item xs>
                        <Card className={classes.root}>
                          <CardContent>
                            <Typography variant="h5" component="h2">
                            {tier.project_name}
                            <br />
                            <br />
                            </Typography>
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
                            #Expired {tier.expired}
                            <br />
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Box component="div">
                                <Button onClick={() => { clickProjectDetail(tier.project_key, tier.project_name)}} size="small" >Project detail</Button>
                              </Box>
                              <Box component="div" visibility={tier.buy_button === true? "visible" : "hidden"}>
                                <Button onClick={() => { buyDialogHandleOpen(tier.name, tier.token_key)}} size="small" >Buy</Button>
                              </Box>
                              <Box component="div" visibility={tier.cancel_sell_button === true? "visible" : "hidden"}>
                                <Button onClick={() => { cancelSellDialogHandleOpen(tier.name, tier.token_key)}} size="small" >Cancel sell</Button>
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

      </LoadingOverlay>
      </div>
  );
}

export default TierMarket;