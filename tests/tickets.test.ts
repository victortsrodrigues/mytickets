import supertest from "supertest";
import app from "../src/app";
import httpStatus from "http-status";
import {
  createTicket,
  createTicketWithCode,
  createUsedTicket,
  generateInvalidId,
  generateInvalidTicketBody,
  generateTicketBody,
  generateValidId,
} from "./factories/tickets-factory";
import prisma from "../src/database/index";
import { createExpiredEvent, createNewEvent } from "./factories/events-factory";

const api = supertest(app);

beforeEach(async () => {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
});

describe("GET /tickets/:eventId", () => {
  it("should return status 400 when id is invalid", async () => {
    const invalidId = generateInvalidId();
    const response = await api.get(`/tickets/${invalidId}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.text).toBe("Invalid id.");
  });

  it("should return all contacts", async () => {
    // arrange
    const event = await createNewEvent();
    await createTicket(event.id);
    await createTicket(event.id);
    // act
    const response = await api.get(`/tickets/${event.id}`);
    // assert
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          owner: expect.any(String),
          code: expect.any(String),
          used: expect.any(Boolean),
          eventId: expect.any(Number),
        }),
      ])
    );
  });
});

describe("POST /tickets", () => {
  it("should return status 422 when body is invalid", async () => {
    const response = await api
      .post("/tickets")
      .send(generateInvalidTicketBody());
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("should return 403 if the event has already happened", async () => {
    // arrange
    const event = await createExpiredEvent();
    const body = generateTicketBody(event.id);
    // act
    const response = await api.post("/tickets").send(body);
    // assert
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return status 409 when the ticket with code for event id already registered", async () => {
    // arrange
    const event = await createNewEvent();
    const body = generateTicketBody(event.id);
    await createTicketWithCode(event.id, body.code, body.owner);
    // act
    const response = await api.post("/tickets").send(body);
    // assert
    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("should create a new tickect", async () => {
    // arrange
    const event = await createNewEvent();
    const body = generateTicketBody(event.id);
    // act
    const response = await api.post("/tickets").send(body);
    // assert
    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual({
      id: expect.any(Number),
      owner: body.owner,
      code: body.code,
      used: false,
      eventId: event.id,
    });
  });
});

describe("PUT /tickets/use/:id", () => {
  it("should return status 400 when id is invalid", async () => {
    const invalidId = generateInvalidId();
    const response = await api.put(`/tickets/use/${invalidId}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.text).toBe("Invalid id.");
  });

  it("should return status 404 when ticket not found", async () => {
    const validId = generateValidId();
    const response = await api.put(`/tickets/use/${validId}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.text).toBe(`Ticket with id ${validId} not found.`);
  });

  it("should return status 403 when ticket is already used", async () => {
    // arrange
    const event = await createNewEvent();
    const ticket = await createUsedTicket(event.id);
    // act
    const response = await api.put(`/tickets/use/${ticket.id}`);
    // assert
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return 403 if the event has already happened", async () => {
    // arrange
    const event = await createExpiredEvent();
    const ticket = await createTicket(event.id);
    // act
    const response = await api.put(`/tickets/use/${ticket.id}`);
    // assert
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return status 204 when ticket is successfully used", async () => {
    // arrange
    const event = await createNewEvent();
    const ticket = await createTicket(event.id);
    // act
    const response = await api.put(`/tickets/use/${ticket.id}`);
    // assert
    expect(response.status).toBe(httpStatus.NO_CONTENT);
  });
});

