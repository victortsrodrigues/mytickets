import prisma from "database";
import { faker } from "@faker-js/faker";

// create a new event
export async function createNewEvent() {
  return await prisma.event.create({
    data: {
      name: faker.lorem.words(2),
      date: faker.date.future().toISOString()
    }
  });
}

// create a new event that has already expired
export async function createExpiredEvent() {
  return await prisma.event.create({
    data: {
      name: faker.lorem.words(2),
      date: new Date(faker.date.past())
    }
  });
}

export async function generateEventBody() {
  return {
    name: faker.lorem.words(2),
    date: faker.date.future().toISOString()
  };
}

export async function generateDifferentEventBody() {
  let name1 = faker.lorem.words(2);
  let name2: string;

  do {
    name2 = faker.lorem.words(2);
  } while (name1 === name2);

  return {
    name1,
    name2
  };
}

export async function createEventWithName(name: string) {
  return await prisma.event.create({
    data: {
      name,
      date: faker.date.future().toISOString()
    }
  });
}