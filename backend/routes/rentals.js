const express = require('express');
const router = express.Router();
const Laptop = require('../models/Laptop');
const Rental = require('../models/Rental');
const { authenticate } = require('./auth');

// Pobierz wszystkie wypożyczone laptopy (oczekujące i potwierdzone)
router.get('/', authenticate, async (req, res) => {
  try {
    // Dodano isRented do select, aby było dostępne w frontendzie
    const laptops = await Laptop.find({ isRented: true }).select('brand model serialNumber rentalStatus rentalDetails isRented');
    res.json(laptops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd pobierania wypożyczeń' });
  }
});

// Utwórz nowe (oczekujące) wypożyczenie
router.post('/', authenticate, async (req, res) => {
  try {
    const { laptopId, fullName, email, phone, startDate, endDate } = req.body; // Dodano startDate, endDate
    
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ message: 'Laptop nie znaleziony' });
    }

    if (laptop.isRented) {
      return res.status(400).json({ message: 'Laptop jest już wypożyczony lub oczekuje na potwierdzenie' });
    }

    laptop.isRented = true;
    laptop.rentalStatus = 'pending';
    laptop.rentalDetails = {
      fullName,
      email,
      phone,
      startDate, // Dodano startDate
      endDate,   // Dodano endDate
      rentedAt: new Date() // Data złożenia wniosku
    };

    await laptop.save();
    res.status(201).json(laptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd tworzenia wniosku o wypożyczenie' });
  }
});

// Potwierdź wypożyczenie
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ message: 'Laptop nie znaleziony' });
    }
    if (!laptop.isRented || laptop.rentalStatus !== 'pending') {
      return res.status(400).json({ message: 'Wypożyczenie nie jest w stanie oczekującym' });
    }

    laptop.rentalStatus = 'confirmed';
    // Można zaktualizować rentedAt na datę potwierdzenia, jeśli jest taka potrzeba
    // laptop.rentalDetails.rentedAt = new Date();
    await laptop.save();
    res.json(laptop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd potwierdzania wypożyczenia' });
  }
});

// Odrzuć wypożyczenie
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ message: 'Laptop nie znaleziony' });
    }
    if (!laptop.isRented || laptop.rentalStatus !== 'pending') {
      return res.status(400).json({ message: 'Wypożyczenie nie jest w stanie oczekującym' });
    }

    laptop.isRented = false;
    laptop.rentalStatus = null;
    laptop.rentalDetails = undefined;
    await laptop.save();
    res.json({ message: 'Wniosek o wypożyczenie odrzucony' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd odrzucania wypożyczenia' });
  }
});

// Zakończ (zwróć) potwierdzone wypożyczenie
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ message: 'Laptop nie znaleziony' });
    }

    if (!laptop.isRented || laptop.rentalStatus !== 'confirmed') {
      return res.status(400).json({ message: 'Laptop nie jest aktualnie wypożyczony (potwierdzony)' });
    }

    // Zapisz dane wypożyczenia przed usunięciem
    // Zapisz dane zakończonego wypożyczenia do historii
    const rentalHistory = new Rental({
      laptopId: laptop._id,
      brand: laptop.brand,
      model: laptop.model,
      serialNumber: laptop.serialNumber, // Dodano serialNumber
      rentedBy: laptop.rentalDetails.email, // Używamy email z rentalDetails
      rentedAt: laptop.rentalDetails.rentedAt, // Data złożenia wniosku/potwierdzenia
      returnedAt: new Date()
    });
    await rentalHistory.save();

    // Zresetuj status laptopa
    laptop.isRented = false;
    laptop.rentalStatus = null;
    laptop.rentalDetails = undefined;

    await laptop.save();
    res.json({ message: 'Wypożyczenie zakończone' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd kończenia wypożyczenia' });
  }
});

module.exports = router;