import { NewEvent, NewTicketCategory, NewTicket, UpdateTicketCategory, UpdateTicket } from '../generated/NFTicketize/NFTicketize';
import { Event, TicketCategory, Ticket } from '../generated/schema';


export function handleNewEvent(event: NewEvent): void {
  let newEvent = new Event(event.params.id.toHex());
  newEvent.creator = event.params.creator;
  newEvent.startDate = event.params.startDate;
  newEvent.metadataIpfsCid = event.params.metadataIpfsCid;
  newEvent.save();
}

export function handleNewTicketCategory(ticketCategory: NewTicketCategory): void {
  let newTicketCategory = new TicketCategory(ticketCategory.params.id.toHex());
  newTicketCategory.eventId = ticketCategory.params.eventId;
  newTicketCategory.currentMintTickets = ticketCategory.params.currentMintTickets;
  newTicketCategory.maxTickets = ticketCategory.params.maxTickets;
  newTicketCategory.ticketPrice = ticketCategory.params.ticketPrice;
  newTicketCategory.resellTicketValue = ticketCategory.params.resellTicketValue;
  newTicketCategory.metadataIpfsCid = ticketCategory.params.metadataIpfsCid;

  newTicketCategory.save();
}

export function handleUpdateTicketCategory(ticketCategory: UpdateTicketCategory): void {
  let id = ticketCategory.params.id.toHex();
  let updateTicketCategory = TicketCategory.load(id);
  if (updateTicketCategory == null) {
    updateTicketCategory = new TicketCategory(ticketCategory.params.id.toHex());
  }
  updateTicketCategory.eventId = ticketCategory.params.eventId;
  updateTicketCategory.currentMintTickets = ticketCategory.params.currentMintTickets;
  updateTicketCategory.maxTickets = ticketCategory.params.maxTickets;
  updateTicketCategory.ticketPrice = ticketCategory.params.ticketPrice;
  updateTicketCategory.resellTicketValue = ticketCategory.params.resellTicketValue;
  updateTicketCategory.metadataIpfsCid = ticketCategory.params.metadataIpfsCid;

  updateTicketCategory.save();
}

export function handleNewTicket(ticket: NewTicket): void {
  let newTicket = new Ticket(ticket.params.id.toHex());
  newTicket.eventId = ticket.params.eventId;
  newTicket.ticketCategoryId = ticket.params.ticketCategoryId;
  newTicket.forBid = ticket.params.forBid;

  newTicket.save();
}

export function handleUpdateTicket(ticket: UpdateTicket): void {
  let id = ticket.params.id.toHex();
  let updateTicket = Ticket.load(id);
  if (updateTicket == null) {
    updateTicket = new Ticket(ticket.params.id.toHex());
  }
  updateTicket.eventId = ticket.params.eventId;
  updateTicket.ticketCategoryId = ticket.params.ticketCategoryId;
  updateTicket.forBid = ticket.params.forBid;

  updateTicket.save();
}