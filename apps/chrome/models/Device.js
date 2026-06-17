const mongoose = require('mongoose')

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  chromeProfileName: { type: String, default: 'Unknown' },
  browserInfo: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  blocked: { type: Boolean, default: false },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Device', deviceSchema)
