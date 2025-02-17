import supertest from "supertest";
import app from "../src/app";
import httpStatus from "http-status";

const api = supertest(app);

describe("GET /health", () => {
  it("should return 200 when ask for health", async () => {
    const result = await api.get("/health");
    expect(result.status).toBe(httpStatus.OK);
    expect(result.text).toBe("I'm okay!");
  });
});
