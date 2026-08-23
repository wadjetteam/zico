/**
 * WADJET GRC — JWT Authentication Service
 * 
 * Implements signed JWT tokens with expiration.
 * - Access Token: 8 hours
 * - Refresh Token: 7 days
 * - Secret from environment variable (falls back to dev-only default)
 * 
 * Token format: base64url(header).base64url(payload).base64url(signature)
 * Algorithm: HS256 (HMAC-SHA256)
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const JWT_SECRET = process.env.WADJET_JWT_SECRET || "wadjet-grc-fixed-secret-2026";
const ACCESS_TOKEN_TTL = 8 * 60 * 60; // 8 hours in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str) {
  return JSON.parse(Buffer.from(str, "base64url").toString("utf8"));
}

function hmacSign(data) {
  return createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
}

export function sign(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL,
    jti: randomBytes(16).toString("hex"),
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(fullPayload));
  const signature = hmacSign(`${headerB64}.${payloadB64}`);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function signRefreshToken(payload) {
  const header = { alg: "HS256", typ: "JWT", typ_token: "refresh" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    userId: payload.userId,
    username: payload.username,
    iat: now,
    exp: now + REFRESH_TOKEN_TTL,
    jti: randomBytes(16).toString("hex"),
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(fullPayload));
  const signature = hmacSign(`${headerB64}.${payloadB64}`);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verify(token) {
  if (!token || typeof token !== "string") return { valid: false, error: "missing_token" };

  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, error: "invalid_format" };

  const [headerB64, payloadB64, signature] = parts;

  const expectedSig = hmacSign(`${headerB64}.${payloadB64}`);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, error: "invalid_signature" };
  }

  let payload;
  try {
    payload = base64urlDecode(payloadB64);
  } catch {
    return { valid: false, error: "invalid_payload" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return { valid: false, error: "token_expired" };
  }

  return { valid: true, payload };
}

export default { sign, signRefreshToken, verify };
