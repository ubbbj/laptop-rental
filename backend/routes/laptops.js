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

// Pobieranie wszystkich laptopów
router.get('/', async (req, res) => {
  try {
    const laptops = await Laptop.find();
    res.json(laptops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas pobierania laptopów' });
  }
});

// Pobieranie pojedynczego laptopa po numerze seryjnym
router.get('/:serialNumber', async (req, res) => {
  try {
    const laptop = await Laptop.findOne({ serialNumber: req.params.serialNumber });
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json(laptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas pobierania laptopa' });
  }
});

// Zmieniamy status laptopa na 'wypożyczony'
router.put('/:serialNumber/rent', async (req, res) => {
  try {
    const { serialNumber } = req.params;

    // Szukamy laptopa po numerze seryjnym
    const laptop = await Laptop.findOne({ serialNumber });

    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }

    if (laptop.isRented) {
      return res.status(400).json({ error: 'Laptop już jest wypożyczony' });
    }

    // Zmieniamy status laptopa na wypożyczony
    laptop.isRented = true;
    laptop.rentedBy = 'Wypożyczający użytkownik';  // Możesz dodać logikę, aby zapisać użytkownika
    laptop.rentedAt = new Date();
    
    await laptop.save();

    res.json(laptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji laptopa' });
  }
});

module.exports = router;
