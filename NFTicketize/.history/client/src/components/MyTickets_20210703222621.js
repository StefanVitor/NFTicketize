import React from 'react';

function MyTickets() {
  return (<div>
    <Async promiseFn={getMyTickets}>
      <Async.Loading>Loading...</Async.Loading>
      <Async.Fulfilled>
        {data => {
        return (
          <Grid container spacing={3} direction='column'>
            {data.map(ticket=> (
              <Grid item xs key={ticket.tokenId}>
                    <Card className={classes.root}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                        #Ticket ID {ticket.tokenId}
                        <br />
                        <br />
                        </Typography>
                        <Box component="div" visibility={ticket.resell_value_flag === true? "visible" : "hidden"}>
                          <Typography variant="body2" component="p" color="textSecondary">
                          #Price in ETH - {ticket.resell_value} ETH
                          <br />
                          </Typography>
                          <Typography variant="body2" component="p" color="textSecondary">
                          #Price in USD - {ticket.price_in_usd} USD
                          <br />
                          </Typography>
                        </Box>
                        <Typography variant="body2" component="p" color="textSecondary">
                        #Created time {ticket.date}
                        <br />
                        </Typography>
                      </CardContent>
                      <CardActions>
                          <Box component="div" visibility={ticket.buy_ticket_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { buyTicketDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Buy</Button>
                          </Box>
                          <Box component="div" visibility={ticket.sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { sellDialogHandleOpen(ticket.tokenId)}} size="small" >Sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_sell_button === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelSellDialogHandleOpen(ticket.tokenId, ticket.order)}} size="small" >Cancel sell</Button>
                          </Box>
                          <Box component="div" visibility={ticket.for_bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { forBidDialogHandleOpen(ticket.tokenId)}} size="small" >For bid</Button>
                          </Box>
                          <Box component="div" visibility={ticket.cancel_for_bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { cancelForBidDialogHandleOpen(ticket.tokenId)}} size="small" >Cancel for bid</Button>
                          </Box>
                          <Box component="div" visibility={ticket.bid === true? "visible" : "hidden"}>
                            <Button onClick={() => { bidDialogHandleOpen(ticket.tokenId)}} size="small" >Bid</Button>
                          </Box>
                        </CardActions>


                        <Box component="div" visibility={(ticket.bid === true || ticket.cancel_for_bid === true)? "visible" : "hidden"}>
                        <Accordion>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                          >
                          <Typography className={classes.heading}>Offers</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Async promiseFn={getBids} ticket={ticket.tokenId}>
                              <Async.Loading>Loading...</Async.Loading>
                              <Async.Fulfilled>
                                {bidsData => {
                                return (
                                  <Grid container spacing={3} direction='column'>
                                    {bidsData.map(bid=> (
                                      <Grid item xs key={bid.hash}>
                                            <Card className={classes.root}>
                                              <CardContent>
                                                <Typography variant="body2" component="p" color="textSecondary">
                                                  #Bid type - {bid.type === "ERC721" ? "Ticket": "Currency"}
                                                <br />
                                                </Typography>
                                                <Box component="div" visibility={bid.type === "ERC721"? "visible" : "hidden"}>
                                                  <Typography variant="body2" component="p" color="textSecondary">
                                                    #Bid description - {bid.description}
                                                  <br />
                                                  </Typography>
                                                </Box>
                                                <Box component="div" visibility={bid.type === "ETH"? "visible" : "hidden"}>
                                                  <Typography variant="body2" component="p" color="textSecondary">
                                                    #Bid value - {bid.value}
                                                  <br />
                                                  </Typography>
                                                </Box>
                                                <Typography variant="body2" component="p" color="textSecondary">
                                                #Created time {bid.date}
                                                <br />
                                                </Typography>
                                              </CardContent>
                                              <CardActions>
                                                  <Box component="div" visibility={bid.accept_bid === true? "visible" : "hidden"}>
                                                    <Button onClick={() => { acceptBidOffer(bid.hash)}} size="small">Accept bid</Button>
                                                  </Box>
                                                  <Box component="div" visibility={bid.cancel_bid === true? "visible" : "hidden"}>
                                                    <Button onClick={() => { cancelBidOffer(bid.hash)}} size="small">Cancel bid</Button>
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

                          </AccordionDetails>
                        </Accordion>
                        </Box>
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

export default MyTickets;