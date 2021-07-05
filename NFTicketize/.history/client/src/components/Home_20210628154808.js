import React from 'react';


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