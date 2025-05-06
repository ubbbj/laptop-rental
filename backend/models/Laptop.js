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
  brand: { type: String, required: true },
  model: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  qrCode: String,
  description: String,
  specs: {
    cpu: String,
    ram: String,
    disk: String,
  },
  images: [String],
  isRented: { type: Boolean, default: false },
  rentalStatus: { type: String, enum: ['pending', 'confirmed'], default: null },
  rentalDetails: {
    fullName: String,
    email: String,
    phone: String,
    startDate: Date,
    endDate: Date,
    rentedAt: Date
  },
});

module.exports = mongoose.model('Laptop', LaptopSchema);
