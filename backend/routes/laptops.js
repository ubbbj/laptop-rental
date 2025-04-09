const express = require('express');
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');
const router = express.Router();
const { authenticate, isAdmin } = require('./auth');

// Tworzenie nowego laptopa z kodem QR
router.post('/', authenticate, isAdmin, async (req, res) => {
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

// Usuwanie laptopa (tylko dla adminów)
router.delete('/:serialNumber', authenticate, isAdmin, async (req, res) => {
  try {
    const laptop = await Laptop.findOneAndDelete({ serialNumber: req.params.serialNumber });
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json({ message: 'Laptop usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania laptopa:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Rezerwacja laptopa
router.post('/:serialNumber/reserve', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const { startDate, endDate, fullName, email, phone, notes } = req.body;

    // Szukamy laptopa po numerze seryjnym
    const laptop = await Laptop.findOne({ serialNumber });

    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }

    if (laptop.isRented) {
      return res.status(400).json({ error: 'Laptop jest już wypożyczony' });
    }

    if (laptop.isReserved) {
      return res.status(400).json({ error: 'Laptop jest już zarezerwowany' });
    }

    // Tworzymy rezerwację
    laptop.isReserved = true;
    laptop.reservation = {
      startDate,
      endDate,
      fullName,
      email,
      phone,
      notes
    };
    
    await laptop.save();

    // Tutaj możesz dodać logikę wysłania potwierdzenia email
    // np. używając nodemailer

    res.json({
      message: 'Laptop został pomyślnie zarezerwowany',
      laptop
    });
  } catch (error) {
    console.error('Błąd rezerwacji laptopa:', error);
    res.status(500).json({ error: 'Błąd podczas rezerwacji laptopa' });
  }
});

// Anulowanie rezerwacji laptopa
router.put('/:serialNumber/cancel-reservation', async (req, res) => {
  try {
    const { serialNumber } = req.params;

    // Szukamy laptopa po numerze seryjnym
    const laptop = await Laptop.findOne({ serialNumber });

    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }

    if (!laptop.isReserved) {
      return res.status(400).json({ error: 'Laptop nie jest zarezerwowany' });
    }

    // Usuwamy rezerwację
    laptop.isReserved = false;
    laptop.reservation = null;
    
    await laptop.save();

    res.json({
      message: 'Rezerwacja została anulowana',
      laptop
    });
  } catch (error) {
    console.error('Błąd anulowania rezerwacji:', error);
    res.status(500).json({ error: 'Błąd podczas anulowania rezerwacji' });
  }
});

module.exports = router;
