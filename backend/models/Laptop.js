const mongoose = require('mongoose');

const LaptopSchema = new mongoose.Schema({
  brand: String,
  model: String,
  serialNumber: String,
  qrCode: String,
  isRented: { type: Boolean, default: false },
  rentedBy: { type: String, default: null },
  rentedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Laptop', LaptopSchema);
