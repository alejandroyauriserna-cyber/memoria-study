import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function encryptionKey(): Buffer {
  const explicit = process.env.USER_AI_ENCRYPTION_KEY?.trim();
  if (explicit) {
    if (/^[0-9a-f]{64}$/i.test(explicit)) {
      return Buffer.from(explicit, "hex");
    }
    const decoded = Buffer.from(explicit, "base64");
    if (decoded.length >= 32) return decoded.subarray(0, 32);
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRole) {
    throw new Error("USER_AI_ENCRYPTION_KEY o SUPABASE_SERVICE_ROLE_KEY requerido para cifrar claves IA.");
  }

  return scryptSync(serviceRole, "memoria-user-ai-secrets-v1", 32);
}

/** Cifra un secreto de usuario (API key). Formato: base64(iv + tag + ciphertext). */
export function encryptUserSecret(plaintext: string): string {
  const key = encryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptUserSecret(payload: string): string {
  const key = encryptionKey();
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error("Secreto cifrado inválido.");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
