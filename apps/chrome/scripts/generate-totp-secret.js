// Run once: node scripts/generate-totp-secret.js
// Copy TOTP_SECRET into .env, then visit GET /api/auth/totp-setup to scan the QR code.
require('dotenv').config()
const { generateSecret } = require('otplib')
const crypto = require('crypto')

const secret = generateSecret()
console.log('\n=== Add to .env ===')
console.log(`TOTP_SECRET=${secret}`)

console.log('\n=== Backup codes (save these somewhere safe — each is one-time use) ===')
for (let i = 0; i < 8; i++) {
  console.log(crypto.randomBytes(4).toString('hex').toUpperCase())
}
console.log('\nAfter scanning the QR code, set TOTP_SETUP_DISABLED=true in .env\n')
