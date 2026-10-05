import { beforeEach, describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { signMobileSession, verifyMobileSession } from "./session-token";
describe("mobile sessions", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET =
      "test-only-session-secret-at-least-32-characters";
  });
  it("accepts a signed mobile identity", async () => {
    expect(await verifyMobileSession(await signMobileSession("user-a"))).toBe(
      "user-a",
    );
  });
  it("rejects a web token without mobile audience", async () => {
    const token = await new SignJWT({ sub: "user-a" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.SESSION_SECRET));
    await expect(verifyMobileSession(token)).rejects.toThrow();
  });
  it("rejects expired sessions", async () => {
    const token = await new SignJWT({ sub: "user-a" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("fitleveling")
      .setAudience("mobile")
      .setExpirationTime(1)
      .sign(new TextEncoder().encode(process.env.SESSION_SECRET));
    await expect(verifyMobileSession(token)).rejects.toThrow();
  });
  it("requires a strong configured signing secret", async () => {
    process.env.SESSION_SECRET = "short";
    await expect(signMobileSession("user-a")).rejects.toThrow("SESSION_SECRET");
  });
});
