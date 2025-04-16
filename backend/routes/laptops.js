const express = require('express');
const mongoose = require('mongoose'); // Dodano import mongoose
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');
const router = express.Router();
const { authenticate, isAdmin } = require('./auth');

// Tworzenie nowego laptopa z kodem QR
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    // Dodano nowe pola
    const { brand, model, serialNumber, description, specs, images } = req.body;
    
    // Use the frontend URL structure
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Use env variable or default
    const qrData = `${frontendBaseUrl}/laptop/serial/${serialNumber}`;
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

// Pobieranie pojedynczego laptopa po ID
router.get('/:id', async (req, res) => {
  try {
    // Sprawdzenie czy ID jest poprawnym ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID laptopa' });
    }

    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json(laptop);
  } catch (error) {
    console.error('Błąd podczas pobierania laptopa po ID:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania laptopa' });
  }
});

// Pobieranie pojedynczego laptopa po numerze seryjnym (może być przydatne np. dla QR kodów)
router.get('/serial/:serialNumber', async (req, res) => { // Zmieniono ścieżkę, aby uniknąć konfliktu z /:id
  try {
    // Można szukać po ID lub serialNumber, tutaj zostawiono serialNumber
    const laptop = await Laptop.findOne({ serialNumber: req.params.serialNumber });
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json(laptop);
  } catch (error) {
    console.error('Błąd podczas pobierania laptopa po SN:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania laptopa' });
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
       // Use the frontend URL structure
       const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Use env variable or default
       const qrData = `${frontendBaseUrl}/laptop/serial/${serialNumber}`;
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

// Usuwanie laptopa (tylko dla adminów)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const laptop = await Laptop.findByIdAndDelete(req.params.id);
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json({ message: 'Laptop usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania laptopa:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});


module.exports = router;
