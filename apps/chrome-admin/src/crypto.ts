const KEY_HEX = (import.meta.env.VITE_ENCRYPTION_KEY as string) ?? ''

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2)
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return arr
}

let cachedKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = await crypto.subtle.importKey(
      'raw',
      hexToBytes(KEY_HEX),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
  }
  return cachedKey
}

export async function decrypt(encryptedHex: string, ivHex: string, authTagHex: string): Promise<string> {
  const key = await getKey()

  // WebCrypto AES-GCM expects ciphertext + authTag concatenated
  const cipher = hexToBytes(encryptedHex)
  const tag = hexToBytes(authTagHex)
  const combined = new Uint8Array(cipher.length + tag.length)
  combined.set(cipher)
  combined.set(tag, cipher.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(ivHex), tagLength: 128 },
    key,
    combined
  )
  return new TextDecoder().decode(decrypted)
}
