/**
 * AES-256-GCM 필드 암호화/복호화
 * - 서버(API Route/Server Action)에서만 사용
 * - 환경변수 FIELD_ENCRYPTION_KEY: 64자 hex 문자열 (= 32바이트 키)
 *   생성 예시: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * 숫자 값을 암호화 → "iv:tag:ciphertext" hex 문자열로 반환
 */
export function encryptField(value: number): string {
  const key = getKey();
  const iv = randomBytes(12);                              // GCM 표준: 96-bit IV
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = String(value);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * "iv:tag:ciphertext" hex 문자열 → 숫자로 복호화
 * DB에 평문 숫자가 저장된 기존 행(마이그레이션 이전)도 안전하게 처리
 */
export function decryptField(value: string | number): number {
  if (typeof value === "number") return value;          // 아직 암호화 안 된 레거시 행

  const parts = value.split(":");
  if (parts.length !== 3) return parseFloat(value);    // 평문 숫자 문자열 fallback

  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();
  const iv  = Buffer.from(ivHex,  "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return parseFloat(decrypted.toString("utf8"));
}
