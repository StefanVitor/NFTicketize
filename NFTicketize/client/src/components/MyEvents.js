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
const NFTicketizeContractArt = require( "../contracts/NFTicketize.json");

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

const uint8ArrayToString = require('uint8arrays/to-string');
const uint8ArrayConcat = require('uint8arrays/concat');
const all = require('it-all');

function EventsDetail({ipfs}) {  
  let history = useHistory();

  // Get my events
  const getMyEvents = async () => {
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    // Get events from TheGraph with filter from MetaMask address (login address)
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
        // Fill event details
        if (ipfsData) {
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
      
      return data;
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
    history.push('/event_detail', {"eventKey": eventKey, "myEvent": "true", "eventName": eventName});
  };

  return (<div>
    <Async promiseFn={getMyEvents}>
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

function ButtonsBox({ onReloadList, onSetOverlay, onSetSnackBarMessage, ipfs}) {

  const classes = useStyles();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [nameValidation, setNameValidation] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [descriptionValidation, setDescriptionValidation] = React.useState(false);
  const [type, setType] = React.useState("Concert");
  const [location, setLocation] = React.useState("");
  const [locationValidation, setLocationValidation] = React.useState(false);
  const [locationAddress, setLocationAddress] = React.useState("");
  const [locationAddressValidation, setLocationAddressValidation] = React.useState(false);
  const [startTime, setStartTime] = React.useState("");
  const [startTimeValidation, setStartTimeValidation] = React.useState(false);

  // Dialog button open
  const handleClickOpen = () => {
    setOpen(true);
  };

  // Diallog button close
  const handleClose = () => {
    setOpen(false);
  };
  
  // Create new event - button
  const handleCreateNewEvent = () => {
    // Validation for event name
    if (!name){
      setNameValidation(true);
      onSetSnackBarMessage("Validation for event name ", "error");
      return;
    } else {
      setNameValidation(false);
    }

    // Validation for event description
    if (!description) {
      setDescriptionValidation(true);
      onSetSnackBarMessage("Validation for event description ", "error");
      return;
    } else {
      setDescriptionValidation(false);
    }

    // Validation for event location
    if (!location) {
      setLocationValidation(true);
      onSetSnackBarMessage("Validation for event location ", "error");
      return;
    } else {
      setLocationValidation(false);
    }

    // Validation for event location address
    if (!locationAddress) {
      setLocationAddressValidation(true);
      onSetSnackBarMessage("Validation for event location address", "error");
      return;
    } else {
      setLocationAddressValidation(false);
    }

    // Validation for event start time
    if (!startTime) {
      onSetSnackBarMessage("Validation for event start time", "error");
      setStartTimeValidation(true);
      return;
    } else {
      if (new Date(Date.parse(startTime)) <= new Date()) {
        onSetSnackBarMessage("Event start time is in past", "error");
        setStartTimeValidation(true);
        return;
      }
      setStartTimeValidation(false);
    }


    createEvent();

    //Close event create dialog
    //setOpen(false);
  };

  const createEvent = async () => {

    setOpen(false);

    onSetOverlay(true);

    const nftTicketizeContract = new ethers.Contract(EnvConstant.contractAddress, NFTicketizeContractArt.abi, provider);

    //Insert into IPFS
    const dataForIpfs = {
      name: name,
      description: description,
      type: type,
      location: location,
      locationAddress: locationAddress
    };
    const { cid } = await ipfs.add(JSON.stringify(dataForIpfs));
    
    //Convert time to milliseconds
    var startTimeObj = new Date(startTime);
    var startTimeMilliseconds = startTimeObj.getTime() / 1000;

    //Insert into smart contract
    const signer = provider.getSigner()
    const nftTicketizeContractWithSigner = nftTicketizeContract.connect(signer);
    try {
      const transactionDetail = await nftTicketizeContractWithSigner.createEvent(startTimeMilliseconds, cid.string);
      await ipfs.pin.add(cid.string);

      await provider.waitForTransaction(transactionDetail.hash);

      onSetSnackBarMessage("Event is success created", "success");
      onReloadList(true);
      onSetOverlay(false);
    }
    catch (error) {
      onSetSnackBarMessage(error.message, "error");
      onSetOverlay(false);
    }
  }

    return (
      <div>
        <Box m={2} pt={1}>
          <Button variant="outlined" color="primary" onClick={handleClickOpen}>
            New event
          </Button>
        </Box>
        <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">New event</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="event_name"
              label="Event name"
              required
              fullWidth
              onChange={event => {
                setName(event.target.value);
              }}
              error={nameValidation}
            />
            <TextField
              margin="dense"
              id="event_description"
              label="Event description"
              required
              multiline
              rows={4}
              fullWidth
              onChange={event => {
                setDescription(event.target.value);
              }}
              error={descriptionValidation}
            />
            <FormControl className={classes.labelFormControl}>
                <InputLabel id="select-tier-time-limit">Event type</InputLabel>
                <Select
                  labelId="select-tier-time-limit"
                  id="Event type"
                  defaultValue={type ?? ""}
                  onChange={event => {
                    setType(event.target.value ?? "");
                  }}
                  >
                  <MenuItem value='Concert'>Concert</MenuItem>
                  <MenuItem value='Conference'>Conference</MenuItem>
                  <MenuItem value='Festival'>Festival</MenuItem>
                  <MenuItem value='Seminar'>Seminar</MenuItem>
                  <MenuItem value='Sport'>Sport</MenuItem>
                </Select>
            </FormControl>
            <TextField
              margin="dense"
              id="location"
              label="Location"
              required
              fullWidth
              onChange={event => {
                setLocation(event.target.value);
              }}
              error={locationValidation}
            />
            <TextField
              margin="dense"
              id="location_address"
              label="Location address"
              required
              fullWidth
              onChange={event => {
                setLocationAddress(event.target.value);
              }}
              error={locationAddressValidation}
            />
            <TextField
              margin="dense"
              id="start_time"
              label="Start time"   
              required
              fullWidth
              type="datetime-local"
              onChange={event => {
                setStartTime(event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              error={startTimeValidation}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose()} color="primary">
              Cancel
            </Button>
            <Button onClick={() => handleCreateNewEvent()} color="primary">
              Create New
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
}

function MyEventsInner({ipfs}) {

  const { enqueueSnackbar } = useSnackbar();
  const [reloadList, setReloadList] = React.useState(false);
  const [isActiveOverlay, setIsActiveOverlay] = React.useState(false);

  const reloadListFunc = () => {
    setReloadList(true);
  }

  // Set loading overlay
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
                  <h4>My events</h4>
              </div>
            </Box>
            <ButtonsBox onReloadList={reloadListFunc} onSetOverlay={setOverlayFunc} onSetSnackBarMessage = {setSnackBarMessage} ipfs={ipfs}>
            </ButtonsBox>
            <EventsDetail ipfs={ipfs}>
            </EventsDetail>   
        </div>
    </LoadingOverlay>
  );
}

export default function MyEvents(props) {
  const ipfs = props.ipfs;
  return (
    <SnackbarProvider maxSnack={3}>
      <MyEventsInner ipfs = {ipfs} />
    </SnackbarProvider>
  );
}
