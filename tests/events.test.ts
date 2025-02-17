import supertest from "supertest";
import app from "../src/app";
import httpStatus from "http-status";
import prisma from "../src/database/index";
import { createEventWithName, createNewEvent, generateDifferentEventBody, generateEventBody } from "./factories/events-factory";
import {
  generateInvalidId,
  generateValidId,
} from "./factories/tickets-factory";

const api = supertest(app);

beforeEach(async () => {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
});

describe("GET /events", () => {
  it("should return all events", async () => {
    // arrange
    await createNewEvent();
    await createNewEvent();
    // act
    const response = await api.get("/events");
    // assert
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          date: expect.any(String),
        }),
      ])
    );
  });
});

describe("GET /events/:id", () => {
  it("should return status 400 when id is invalid", async () => {
    const invalidId = generateInvalidId();
    const response = await api.get(`/events/${invalidId}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.text).toBe("Invalid id.");
  });

  it("should return status 404 when event does not exist", async () => {
    const validId = generateValidId();
    const response = await api.get(`/events/${validId}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.text).toBe(`Event with id ${validId} not found.`);
  });

  it("should return event", async () => {
    // arrange
    const event = await createNewEvent();
    // act
    const response = await api.get(`/events/${event.id}`);
    // assert
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
    });
  });
});

describe("POST /events", () => {
  it("should return status 422 when body is invalid", async () => {
    const response = await api
      .post("/events")
      .send({ name: "Event", date: "invalid date" });
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("should return 409 when an event with the same name already exists", async () => {
    // arrange
    const event = await createNewEvent();
    const body = { name: event.name, date: event.date };
    // act
    const response = await api.post("/events").send(body);
    // assert
    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("should create a new event", async () => {
    // arrange
    const body = await generateEventBody();
    console.log(body);
    // act
    const response = await api.post("/events").send(body);
    // assert
    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual({
      id: expect.any(Number),
      name: body.name,
      date: body.date,
    });
    console.log(response.body);
  });
});

describe("PUT /events/:id", () => {
  it("should return 422 when body is invalid", async () => {
    const validId = generateValidId();
    const response = await api
      .put(`/events/${validId}`)
      .send({ name: "Event", date: "invalid date" });
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("should return status 400 when id is invalid", async () => {
    const invalidId = generateInvalidId();
    const body = await generateEventBody();
    const response = await api.put(`/events/${invalidId}`).send(body);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.text).toBe("Invalid id.");
  });

  it("should return 404 when event does not exist", async () => {
    const validId = generateValidId();
    const body = await generateEventBody();
    const response = await api.put(`/events/${validId}`).send(body);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.text).toBe(`Event with id ${validId} not found.`);
  });

  it("should return 409 when the new name is diffent from the old one, but is already in use", async () => {
    // arrange
    const {name1, name2} = await generateDifferentEventBody();
    const event_target = await createEventWithName(name1);
    const event_existing = await createEventWithName(name2);
    const body = { name: event_existing.name, date: event_target.date };
    // act
    const response = await api.put(`/events/${event_target.id}`).send(body);
    // assert
    expect(response.status).toBe(httpStatus.CONFLICT);
  })

  it("should update an event", async () => {
    // arrange
    const event = await createNewEvent();
    const body = { name: "New Event", date: event.date };
    // act
    const response = await api.put(`/events/${event.id}`).send(body);
    // assert
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: event.id,
      name: body.name,
      date: body.date.toISOString(),
    });
  });
});

describe("DELETE /events/:id", () => {
  it("should return status 400 when id is invalid", async () => {
    const invalidId = generateInvalidId();
    const response = await api.delete(`/events/${invalidId}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.text).toBe("Invalid id.");
  });

  it("should return status 404 when event does not exist", async () => {
    const validId = generateValidId();
    const response = await api.delete(`/events/${validId}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.text).toBe(`Event with id ${validId} not found.`);
  });

  it("should delete an event", async () => {
    // arrange
    const event = await createNewEvent();
    // act
    const response = await api.delete(`/events/${event.id}`);
    // assert
    expect(response.status).toBe(httpStatus.NO_CONTENT);

    // check if it is deleted
    const response2 = await api.get(`/events/${event.id}`);
    expect(response2.status).toBe(httpStatus.NOT_FOUND);
  });	
});
