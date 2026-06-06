import { createHash, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string) {
  const expected = Buffer.from(hashPassword(password));
  const actual = Buffer.from(hash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
