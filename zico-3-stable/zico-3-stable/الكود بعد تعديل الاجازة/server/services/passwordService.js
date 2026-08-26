/**
 * WADJET GRC — Password Security Utility
 * Uses Node.js built-in scrypt (memory-hard KDF) — no external dependencies.
 * Format: scrypt$<salt_hex>$<hash_hex>
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;
const SCRYPT_COST = 16384; // N
const SCRYPT_BLOCK_SIZE = 8; // r
const SCRYPT_PARALLELISM = 1; // p

export function hashPassword(plaintext) {
  const salt = randomBytes(16);
  const hash = scryptSync(plaintext, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELISM, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(plaintext, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plaintext, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELISM, KEY_LEN);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function isPlaintext(value) {
  return typeof value === "string" && !value.startsWith("scrypt$");
}

export default { hashPassword, verifyPassword, isPlaintext };
