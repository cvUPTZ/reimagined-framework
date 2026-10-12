import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
function key() {
  const raw = process.env['APP_USER_CONNECTION_KEY_SECRET'];
  if (!raw) throw new Error('Connection encryption is not configured.');
  return Buffer.from(raw, 'base64');
}
export function encryptConnectionKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
export function decryptConnectionKey(value: string) {
  const buffer = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key(), buffer.subarray(0, 12));
  decipher.setAuthTag(buffer.subarray(12, 28));
  return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8');
}