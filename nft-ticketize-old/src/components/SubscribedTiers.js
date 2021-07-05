import React from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { Magic } from "magic-sdk";
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { ZilliqaExtension } from "@magic-ext/zilliqa";
import { EnvConstant} from ".././const";
import { BN, units} from '@zilliqa-js/util';
import Async from 'react-async';
import { firebase } from '@firebase/app';
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

// Smart contract initialization
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
const deployedContract = zilliqa.contracts.at(EnvConstant.contractAddress);

// Firebase initialization
if (!firebase.apps.length) {
  firebase.initializeApp(EnvConstant.firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}
const dbRef = firebase.database().ref();

function SubscribedTiers() {
  let history = useHistory();

  const classes = useStyles();

  // Go to project detail
  const clickProjectDetail = (projectKey, projectName) =>  {
    history.push('/project_detail', {"projectKey": projectKey, "myProject": "false", "projectName": projectName});
  };

  //Get tiers from project
  const getSubscribedTiers = async () => {
    try {
      // Mapping between tier id and project
      var csTiersProject = await deployedContract.getSubState('tier_ids_project');
      // Mapping between token id and token owner(address)
      var csTokensOwners = await deployedContract.getSubState('tokens_owner');
      // Mapping between token id and tier_id
      var csTokensTierId = await deployedContract.getSubState('tokens_tier_id');
      // Mapping between tier id and subscriber count
      var csTiersSubscriberCount = await deployedContract.getSubState('tier_ids_subscriber_count');
      // Mapping between tier id and tier price
      var csTiersPrice = await deployedContract.getSubState('tier_ids_price');
      var wallet = await magic.zilliqa.getWallet();
      var data = [];
      for (var tokenId in csTokensOwners.tokens_owner) {
        var tokenOwner = csTokensOwners.tokens_owner[tokenId];
        // If user posses token for that tier
        if (tokenOwner.toLowerCase() === wallet.address.toLowerCase()) {
          var tierKey = csTokensTierId.tokens_tier_id[tokenId];
          var tierDetail = await getTierDetail(tierKey);
          // Get tier price
          tierDetail.price = csTiersPrice.tier_ids_price[tierKey];

          // Get subscriber count
          var subscriberCount = csTiersSubscriberCount.tier_ids_subscriber_count[tierKey];
          if (subscriberCount) {
            tierDetail.subscriber_count = subscriberCount; 
          } else {
            tierDetail.subscriber_count = 0;
          }

          // Get project details
          var projectKey = csTiersProject.tier_ids_project[tierKey];
          var projectDetail = await getProjectDetail(projectKey);
          tierDetail.project_key = projectKey;
          tierDetail.project_name = projectDetail.name;

          // Fill expired field
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
          data.push(tierDetail);
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
          <Box m={2} pt={1}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
              <h4>Subscribed Tiers</h4>
            </div>
          </Box>
          <Box m={2} pt={1}>
        <div style={{display: 'flex',  justifyContent:'left', alignItems:'center'}}>
          <h5>Tiers</h5>
        </div>
        </Box>

        <Async promiseFn={getSubscribedTiers}>
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
      </div>
  );
}

export default SubscribedTiers;