'use server';

import { createDecipheriv, createHash } from 'crypto';

export async function decryptPrivateKey(encryptedData: string): Promise<string> {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Generate a 32-byte key from the environment variable
    const hash = createHash('sha256');
    hash.update(encryptionKey);
    const key = hash.digest();

    // Split the encrypted data into IV and encrypted private key
    const [ivHex, encryptedPrivateKey] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    // Create decipher
    const decipher = createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the private key
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting private key:', error);
    throw new Error('Failed to decrypt private key');
  }
}