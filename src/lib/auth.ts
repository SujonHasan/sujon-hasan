import { SignJWT, jwtVerify } from "jose";

let cachedSecret: Uint8Array | null = null;

/**
 * Read lazily rather than at module scope. `next build` imports every route
 * module to collect page data, so throwing here would fail the whole build on
 * any machine without the variable set — instead of failing the one request
 * that actually needs to sign or verify a token.
 */
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Please define the JWT_SECRET environment variable");
  }

  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  // Resolved outside the try block: a missing secret is a misconfiguration and
  // should surface, not be swallowed as "invalid token".
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch {
    return null;
  }
}
