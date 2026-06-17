const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Admin', adminSchema)
