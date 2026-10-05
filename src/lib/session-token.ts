import { SignJWT, jwtVerify } from "jose";
const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
};
export async function signMobileSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("fitleveling")
    .setAudience("mobile")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}
export async function verifyMobileSession(token: string) {
  const { payload } = await jwtVerify(token, key(), {
    algorithms: ["HS256"],
    issuer: "fitleveling",
    audience: "mobile",
  });
  return payload.sub ?? null;
}
