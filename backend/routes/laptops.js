const express = require('express');
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');

const router = express.Router();

// Tworzenie nowego laptopa z kodem QR
router.post('/', async (req, res) => {
  try {
    const { brand, model, serialNumber } = req.body;
    
    const qrData = `https://twoja-aplikacja.com/laptop/${serialNumber}`;

    const qrCode = await QRCode.toDataURL(qrData);

    const newLaptop = new Laptop({ brand, model, serialNumber, qrCode });
    await newLaptop.save();

    res.json(newLaptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas dodawania laptopa' });
  }
});

module.exports = router;
