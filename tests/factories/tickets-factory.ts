import prisma from "database";
import { faker } from "@faker-js/faker";
import { createNewEvent } from "./events-factory";

export function generateInvalidId() {
  const invalidId = [-1, 0, "a"];
  return invalidId[Math.floor(Math.random() * invalidId.length)];
}

export function generateValidId() {
  return Math.floor(Math.random() * 1000);
}

export function generateTicketBody(eventId: number) {
  return {
    owner: faker.person.fullName(),
    code: faker.string.alphanumeric(10),
    eventId: eventId,
  };
}

export async function createTicket(eventId: number) {
  const body = generateTicketBody(eventId);
  return await prisma.ticket.create({
    data: body,
  });
}

export async function generateInvalidTicketBody() {
  const event = await createNewEvent();
  const body = generateTicketBody(event.id);
  body.code = "";
  return body;
}

export async function createTicketWithCode(
  eventId: number,
  code: string,
  owner: string
) {
  return await prisma.ticket.create({
    data: {
      owner,
      code,
      eventId,
    },
  });
}

export async function createUsedTicket(eventId: number) {
  const body = generateTicketBody(eventId);
  const ticket = await prisma.ticket.create({
    data: {
      owner: body.owner,
      code: body.code,
      eventId: body.eventId,
      used: true,
    },
  });
  return ticket;
}
