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
  description: String, // Dodano opis
  specs: { // Dodano specyfikację
    cpu: String,
    ram: String,
    disk: String,
    // Można dodać więcej pól specyfikacji w przyszłości
  },
  images: [String], // Dodano tablicę URL-i zdjęć
  isRented: { type: Boolean, default: false },
  // Usunięto rentedBy i rentedAt z głównego schematu
  rentalStatus: { type: String, enum: ['pending', 'confirmed'], default: null },
  rentalDetails: {
    fullName: String,
    email: String,
    phone: String,
    startDate: Date, // Dodano datę rozpoczęcia
    endDate: Date,   // Dodano datę zakończenia
    rentedAt: Date // Data złożenia wniosku
  },
  // Usunięto isReserved i reservation
});

module.exports = mongoose.model('Laptop', LaptopSchema);
