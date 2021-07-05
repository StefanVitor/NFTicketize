import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { Magic } from "magic-sdk";
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { ZilliqaExtension } from "@magic-ext/zilliqa";
import { EnvConstant} from ".././const";
import Async from 'react-async';
import { firebase } from '@firebase/app';
import { useHistory } from "react-router-dom";
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
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
  labelFormControl: {
    minWidth: 120,
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

// Function to compare (order) post per created date
const comparePosts = function( a, b ) {
  if (b.created_date < a.created_date ){
    return -1;
  }
  if (b.created_date > a.created_date ){
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

function Home() {
  let history = useHistory();

  // Get all posts with project detail from database
  const getAllPosts = async() => {
    var allPosts = await getPosts();
    for (var counter = 0; counter < allPosts.length; counter++) {
      var projectDetail = await getProjectDetail(allPosts[counter].project_key);
      allPosts[counter].project_name = projectDetail.name;
    }
    allPosts.sort(comparePosts);
    return allPosts;
  }

  // Get posts in detail
  const getPosts = async () => {
    try {
      var data = []; 
      // Mapping between token id and tier_id
      var csTokensTierId = await deployedContract.getSubState('tokens_tier_id');
      // Mapping between token id and token owner(address)
      var csTokensOwner = await deployedContract.getSubState('tokens_owner');
      // Mapping between project id and project owner(address)
      var csProjectsOwner = await deployedContract.getSubState('projects_owner');
      var wallet = await magic.zilliqa.getWallet();
      return dbRef.child("posts").get().then((snapshot) => {
        if (snapshot.exists()) {
          var obj = snapshot.val();
          for (var projectKey in obj) {
            var project = obj[projectKey];
            for (var postKey in project) {
              // If it is post from own project
              if (csProjectsOwner.projects_owner[projectKey].toLowerCase() ===  wallet.address.toLowerCase()) {
                var objForPush = project[postKey];
                objForPush.project_key = projectKey;
                objForPush.my_project = "true";
                data.push(objForPush); 
              } else { //If it is post from other projects
                var foundTier = false;
                for (var tierKey in project[postKey]["post_tiers"]) {
                  if (foundTier === false) { 
                    for(var tokenKey in csTokensTierId.tokens_tier_id) {
                      //Check if user has priviligies(tier) to see that post
                      if (csTokensTierId.tokens_tier_id[tokenKey] === tierKey 
                        && csTokensOwner.tokens_owner[tokenKey].toLowerCase() === wallet.address.toLowerCase()) {
                          var objForPush = project[postKey];
                          objForPush.project_key = projectKey;
                          objForPush.my_project = "false";
                          data.push(objForPush); 
                          foundTier = true;
                      }
                    }
                  }
                }
              }
            }
          }
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

  // Go to project detail page
  const navigateToProjectPage = (projectKey, myProject, projectName) =>{
    history.push('/project_detail', {"projectKey": projectKey, "myProject": myProject, "projectName": projectName});
  };

  const classes = useStyles();

  return (<div>
      <Box m={2} pt={1}>
        <div style={{display: 'flex',  justifyContent:'left', alignItems:'center', padding:"5"}}>
          <h5>Home</h5>
        </div>
      </Box>
      <Async promiseFn={getAllPosts}>
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
                          Project name: {post.project_name}
                          <br />
                          <br />
                          </Typography>  
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
                        <CardActions>
                          <Button size="small" onClick={()=>navigateToProjectPage(post.project_key, post.my_project, post.project_name)}>Project page</Button>
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

export default Home;