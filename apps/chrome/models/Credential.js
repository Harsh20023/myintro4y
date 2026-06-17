const mongoose = require('mongoose')

const credentialSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    gstin: { type: String, default: '' },
    siteUrl: { type: String, default: '' },
    encryptedUsername: { type: String, required: true },
    usernameIv: { type: String, required: true },
    usernameAuthTag: { type: String, required: true },
    encryptedPassword: { type: String, required: true },
    passwordIv: { type: String, required: true },
    passwordAuthTag: { type: String, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Credential', credentialSchema)
