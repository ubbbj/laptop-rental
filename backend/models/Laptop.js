const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const LaptopSchema = new mongoose.Schema({
  brand: String,
  model: String,
  serialNumber: String,
  qrCode: String,
  isRented: { type: Boolean, default: false },
  rentedBy: { type: String, default: null },
  rentedAt: { type: Date, default: null },
  isReserved: { type: Boolean, default: false },
  reservation: ReservationSchema
});

module.exports = mongoose.model('Laptop', LaptopSchema);
