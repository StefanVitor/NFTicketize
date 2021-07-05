import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
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
import { EnvConstant} from "../const";
import { BN, Long, bytes, units} from '@zilliqa-js/util';
import Async from 'react-async';
import { firebase } from '@firebase/app';
import { useHistory } from "react-router-dom";
import LoadingOverlay from 'react-loading-overlay';
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

  // Get my projects
  const getMyProjects = async () => {
    try {
      // Mapping between project id and project owner
      var contractState = await deployedContract.getSubState('projects_owner');
      var wallet = await magic.zilliqa.getWallet();
      var data = [];
      if (contractState.projects_owner) {
        for(var key in contractState.projects_owner){
          // If project owner address is equal to wallet address (project is mine)
          if (contractState.projects_owner[key].toLowerCase() === wallet.address.toLowerCase()) {
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
    history.push('/project_detail', {"projectKey": projectKey, "myProject": "true", "projectName": projectName});
  };

  return (<div>
    <Async promiseFn={getMyProjects}>
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

function ButtonsBox({ onReloadList, onSetOverlay}) {
  // Function for create new project
  const createNewProject = async (projectName, projectDescription) => {
    try {
      onSetOverlay(true);
      const myGasPrice = units.toQa(EnvConstant.gasPrice, units.Units.Li); 
      const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
      const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); 

      // Is user has enough gas
      if (isGasSufficient)
      {
        const VERSION = bytes.pack(EnvConstant.chainId, EnvConstant.msgVersion);
        const params = {
          // amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(8000),
        };
        const args = [];

        // Call transition from smart contract
        const result = await magic.zilliqa.callContract(
          'CreateProject', args, params, 33, 1000, false, EnvConstant.contractAddress
        );

        if (result)
        {
          if (result.receipt)
          {
            if (result.receipt.success)
            {
              const paramsResult = result.receipt.event_logs[0].params;

              // If transition is success, insert into database
              if (paramsResult[0].vname === "project_id") {
                var projectId = paramsResult[0].value;
                firebase.database().ref('projects/' + projectId).set({
                  name: projectName,
                  description: projectDescription
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

  const [open, setOpen] = React.useState(false);
  const [createNewProjectName, setCreateNewProjectName] = React.useState("");
  const [createNewProjectNameValidation, setCreateNewProjectNameValidation] = React.useState(false);
  const [createNewProjectDesc, setCreateNewProjectDesc] = React.useState("");
  const [createNewProjectDescValidation, setCreateNewProjectDescValidation] = React.useState(false);

  // Dialog button open
  const handleClickOpen = () => {
    setOpen(true);
  };

  // Diallog button close
  const handleClose = () => {
    setOpen(false);
  };
  
  // Create new project - button
  const handleCreateNewProject = () => {
    // Validation for project name
    if (!createNewProjectName){
      setCreateNewProjectNameValidation(true);
      return;
    }
    else {
      setCreateNewProjectNameValidation(false);
    }

    // Validation for project description
    if (!createNewProjectDesc) {
      setCreateNewProjectDescValidation(true);
      return;
    }
    else {
      setCreateNewProjectDescValidation(false);
    }

    // Call function for insert project into smart contract and database 
    createNewProject(createNewProjectName, createNewProjectDesc);
    setOpen(false);
  };

    return (
      <div>
        <Box m={2} pt={1}>
          <Button variant="outlined" color="primary" onClick={handleClickOpen}>
            New project
          </Button>
        </Box>
        <Dialog open={open} validate onClose={handleClose} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">New project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="project_name"
              label="Project name"
              required
              fullWidth
              onChange={event => {
                setCreateNewProjectName(event.target.value);
              }}
              error={createNewProjectNameValidation}
            />
            <TextField
              margin="dense"
              id="project_description"
              label="Project description"
              required
              multiline
              rows={4}
              fullWidth
              onChange={event => {
                setCreateNewProjectDesc(event.target.value);
              }}
              error={createNewProjectDescValidation}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleCreateNewProject} color="primary">
              Create New
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
}

function MyProjects() {
  const [reloadList, setReloadList] = React.useState(false);
  const [isActiveOverlay, setIsActiveOverlay] = React.useState(false);

  const reloadListFunc = () => {
    setReloadList(true);
  }

  // Set loading overlay
  const setOverlayFunc = (value) => {
    setIsActiveOverlay(value);
  }

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
          <Box m={2} pt={1}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                <h4>My projects</h4>
            </div>
          </Box>
          <ButtonsBox onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc}>
          </ButtonsBox>
          <ProjectsDetail>
          </ProjectsDetail>      
      </div>
    </LoadingOverlay>
  );
}

export default MyProjects;