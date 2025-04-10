const express = require('express');
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');
const router = express.Router();
const { authenticate, isAdmin } = require('./auth');

// Tworzenie nowego laptopa z kodem QR
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    // Dodano nowe pola
    const { brand, model, serialNumber, description, specs, images } = req.body;
    
    const qrData = `https://twoja-aplikacja.com/laptop/${serialNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Dodano nowe pola do tworzonego obiektu
    const newLaptop = new Laptop({
      brand,
      model,
      serialNumber,
      qrCode,
      description,
      specs,
      images: images || [] // Upewnij się, że images jest tablicą
    });
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

// Usunięto stary endpoint /rent - obsługa wypożyczeń jest w rentals.js

// Pobieranie pojedynczego laptopa po ID lub numerze seryjnym
// Zmieniono na ID dla spójności z innymi trasami PUT/DELETE
router.get('/:serialNumber', async (req, res) => {
  try {
    // Można szukać po ID lub serialNumber, tutaj zostawiono serialNumber
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

// Aktualizacja laptopa (tylko dla adminów)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { brand, model, serialNumber, description, specs, images } = req.body;
    
    // Generowanie nowego QR kodu jeśli numer seryjny się zmienił
    let qrCode = req.body.qrCode; // Zachowaj stary, jeśli nie ma zmiany SN
    const existingLaptop = await Laptop.findById(req.params.id);
    if (!existingLaptop) {
       return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    if (serialNumber && existingLaptop.serialNumber !== serialNumber) {
       const qrData = `https://twoja-aplikacja.com/laptop/${serialNumber}`;
       qrCode = await QRCode.toDataURL(qrData);
    }

    const updatedLaptop = await Laptop.findByIdAndUpdate(
      req.params.id,
      {
        brand,
        model,
        serialNumber,
        description,
        specs,
        images: images || [], // Upewnij się, że images jest tablicą
        qrCode // Zaktualizuj QR kod jeśli trzeba
      },
      { new: true } // Zwraca zaktualizowany dokument
    );

    if (!updatedLaptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json(updatedLaptop);
  } catch (error) {
    console.error('Błąd aktualizacji laptopa:', error);
    // Obsługa błędu duplikatu klucza (unique: true dla serialNumber)
    if (error.code === 11000) {
       return res.status(400).json({ error: 'Numer seryjny musi być unikalny.' });
    }
    res.status(500).json({ error: 'Błąd serwera podczas aktualizacji laptopa' });
  }
});

// Usuwanie laptopa (tylko dla adminów) - zmieniono na ID
router.delete('/:serialNumber', authenticate, isAdmin, async (req, res) => {
  try {
    const laptop = await Laptop.findByIdAndDelete(req.params.id); // Zmieniono na findByIdAndDelete
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json({ message: 'Laptop usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania laptopa:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usunięto stare endpointy rezerwacji

module.exports = router;
