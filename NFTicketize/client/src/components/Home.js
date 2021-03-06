import React from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { EnvConstant} from "../const";
import Async from 'react-async';
import { useHistory } from "react-router-dom";
import { ethers } from "ethers";
import { ApolloClient, InMemoryCache, gql} from '@apollo/client';

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
  }
});

// Ethers.js initialization
const provider = new ethers.providers.Web3Provider(window.ethereum); 

const defaultOptions = {
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

// Function to compare (order) post per created date
const compareEvents = function( a, b ) {
  if ( new Date(b.start_date)> new Date(a.start_date) ){
    return -1;
  }
  if ( new Date(b.start_date) < new Date(a.start_date) ){
    return 1;
  }
  return 0;
};

function Home(props) {  
  let history = useHistory();
  let ipfs = props.ipfs;

  // Get events exclude my own
  const getEvents = async () => {
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    const tokensQuery = `
      { events(where: { creator_not: "` + address + `" }) {
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
        // Get details about event from IPFS
        const ipfsData = await getEventsDetail(events[counter].metadataIpfsCid);
        if (ipfsData) {
          if (new Date() <= new Date(parseInt(events[counter].startDate) * 1000)) {
            data.push({
              key: parseInt(events[counter].id),
              name: ipfsData.name,
              description: ipfsData.description,
              type: ipfsData.type,
              location: ipfsData.location,
              location_address: ipfsData.locationAddress,
              start_date: new Date(parseInt(events[counter].startDate) * 1000).toLocaleString()
            });
          }
        }
      }
      return data.sort(compareEvents);
    }
    return [];
  }

  // Get event detail from IPFS
  const getEventsDetail = async(metadataIpfsCid) =>  {
    if (ipfs != null) {
      const ipfsData = uint8ArrayConcat(await all(ipfs.cat(metadataIpfsCid)));
      const ipfsDataJSON = JSON.parse(uint8ArrayToString(ipfsData));
      return ipfsDataJSON;
    }
    return null;
  }

  const classes = useStyles();

  // Go to event detail page
  const navigateToDetailPage = (eventKey, eventName) =>{
    history.push('/event_detail', {"eventKey": eventKey, "myEvent": "false", "eventName": eventName});
  };

  return (<div>
    <Box m={2} pt={1}>
      <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
        <h4>All events</h4>
      </div>
    </Box>
    <Async promiseFn={getEvents}>
      <Async.Loading>Loading...</Async.Loading>
      <Async.Fulfilled>
        {data => {
        return (
          <Grid container spacing={3} direction='column'>
            {data.map(event=> (
              <Grid item xs key={event.key}>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        {event.name}
                        </Typography>  
                        <Typography variant="body2" component="p">
                        {event.description}
                        </Typography>
                        <br/>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Event type - {event.type}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Location {event.location}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Location address (type) - {event.location_address}
                        <br />
                        </Typography>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Start date - {event.start_date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={()=>navigateToDetailPage(event.key, event.name)}>Detail</Button>
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