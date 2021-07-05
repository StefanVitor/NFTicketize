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
import { SnackbarProvider, useSnackbar } from 'notistack';
import { EnvConstant} from "../const";
import Async from 'react-async';
import { useHistory } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { ethers } from "ethers";
import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';


function Home() {  
  let history = useHistory();

  // Get my projects
  const getMyEvents = async () => {
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    const tokensQuery = `
      { events(where: { creator: "` + address + `" }) {
        id
        startDate
        metadataIpfsCid
        creator
    }} `;

    var dataFromSubGraph = await client.query({
      query: gql(tokensQuery)
    });
    var events = dataFromSubGraph.data.events;
    if (events.length > 0) {
      var data = [];
      for (var counter = 0; counter < events.length; counter++) {
        const ipfsData = await getEventsDetail(events[counter].metadataIpfsCid);
        data.push({
          key: parseInt(events[counter].id),
          name: ipfsData.name,
          description: ipfsData.description,
          type: ipfsData.type,
          location: ipfsData.location,
          location_address: ipfsData.locationAddress
        });
      }
      ipfs.stop().catch(err => console.error(err));
      ipfs = null;
      return data;
    }
    return [];
  }

  // Get project detail from database
  const getEventsDetail = async(metadataIpfsCid) =>  {
    if (ipfs == null) {
      ipfs = await IPFS.create();
    }
    const ipfsData = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCid)));
    const ipfsDataJSON = JSON.parse(uint8ArrayToString(ipfsData));
    return ipfsDataJSON;
  }

  const classes = useStyles();

  // Go to project detail page
  const navigateToDetailPage = (eventKey, eventName) =>{
    history.push('/event_detail', {"eventKey": eventKey, "myEvent": "true", "eventName": eventName});
  };

  return (<div>
    <Async promiseFn={getMyEvents}>
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
                        <br/>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Event type - {project.type}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Location {project.location}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Location address (type) - {project.location_address}
                        <br />
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

export default Home;