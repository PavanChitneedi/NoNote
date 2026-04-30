import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Derive a 32-byte key from the JWT secret
function getKey() {
  return createHash("sha256")
    .update(process.env.JWT_ACCESS_SECRET || "fallback-change-me")
    .digest();
}

export function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv  = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc  = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag  = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const buf  = Buffer.from(ciphertext, "base64");
    const iv   = buf.slice(0, 12);
    const tag  = buf.slice(12, 28);
    const enc  = buf.slice(28);
    const key  = getKey();
    const dec  = createDecipheriv("aes-256-gcm", key, iv);
    dec.setAuthTag(tag);
    return Buffer.concat([dec.update(enc), dec.final()]).toString("utf8");
  } catch {
    return null;
  }
}
