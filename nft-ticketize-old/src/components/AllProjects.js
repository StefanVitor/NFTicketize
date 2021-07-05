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

function ProjectsDetail() {  
  let history = useHistory();

  // Get all projects (except my projects)
  const getAllProjects = async () => {
    try {
      // Mapping between project id and project owner (address)
      var contractState = await deployedContract.getSubState('projects_owner');
      var wallet = await magic.zilliqa.getWallet();
      var data = [];
      if (contractState.projects_owner) {
        for(var key in contractState.projects_owner){
          // If it isn't my project
          if (contractState.projects_owner[key].toLowerCase() !== wallet.address.toLowerCase()) {
            // Get project detail
            var projectDetail = await getProjectDetail(key);
            if (projectDetail) {
              data.push(projectDetail);
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

  const classes = useStyles();

  // Go to project detail page
  const navigateToDetailPage = (projectKey, projectName) =>{
    history.push('/project_detail', {"projectKey": projectKey, "myProject": "false", "projectName": projectName});
  };

  return (
    <div>
      <Async promiseFn={getAllProjects}>
        <Async.Loading>Loading...</Async.Loading>
        <Async.Fulfilled>
          {data => {
          return (
            <Grid container spacing={3} direction='column'>
              {data.map(project=> (
                <Grid item xs>
                  <Card className={classes.root}>
                    <CardContent>
                      <Typography variant="h5" component="h2">
                      {project.name}
                      </Typography>  
                      <Typography variant="body2" component="p">
                      {project.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={()=>navigateToDetailPage(project.key, project.name)}>Detail</Button>
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

function AllProjects() {
  return (
    <div>
      <Box m={2} pt={1}>
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
          <h4>All projects</h4>
        </div>
      </Box>
      <ProjectsDetail>
      </ProjectsDetail>
    </div>
  );
}

export default AllProjects;