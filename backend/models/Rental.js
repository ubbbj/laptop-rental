const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  laptopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Laptop'
  },
  brand: String,
  model: String,
  serialNumber: String,
  rentedBy: String,
  rentedAt: Date,
  returnedAt: Date
});

module.exports = mongoose.model('Rental', RentalSchema);