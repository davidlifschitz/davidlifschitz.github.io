const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class WrongPassphraseError extends Error {
  constructor() {
    super('Wrong encryption passphrase. Check the passphrase and try again.');
    this.name = 'WrongPassphraseError';
  }
}

export function assertSecureCryptoContext() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Secure browser context required. Open ShortcutForge over HTTPS or localhost.');
  }
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function deriveKey(passphrase, salt) {
  assertSecureCryptoContext();
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptApiKey(apiKey, passphrase) {
  assertSecureCryptoContext();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(apiKey),
  );

  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: 250000,
    cipher: 'AES-GCM',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    savedAt: new Date().toISOString(),
  };
}

export function validateEncryptedBlob(encrypted) {
  if (!encrypted || typeof encrypted !== 'object') {
    throw new Error('Saved key data is missing or invalid.');
  }
  for (const field of ['salt', 'iv', 'ciphertext']) {
    if (typeof encrypted[field] !== 'string' || !encrypted[field]) {
      throw new Error('Saved key data is corrupt or incomplete.');
    }
  }
  if (encrypted.version && encrypted.version !== 1) {
    throw new Error('Unsupported saved key format version.');
  }
}

export async function decryptApiKey(encrypted, passphrase) {
  validateEncryptedBlob(encrypted);
  try {
    const salt = base64ToBytes(encrypted.salt);
    const iv = base64ToBytes(encrypted.iv);
    const ciphertext = base64ToBytes(encrypted.ciphertext);
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return decoder.decode(plaintext);
  } catch (error) {
    if (error?.name === 'OperationError') {
      throw new WrongPassphraseError();
    }
    throw error;
  }
}
