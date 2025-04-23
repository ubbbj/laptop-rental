const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');
const router = express.Router();
const { authenticate, isAdmin } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter to accept only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki graficzne!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Tworzenie nowego laptopa z kodem QR
router.post('/', authenticate, isAdmin, upload.array('files', 10), async (req, res) => {
  try {
    // Parse JSON strings from form data
    const specs = req.body.specs ? JSON.parse(req.body.specs) : {};
    const imageUrls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
    
    // Get uploaded file paths
    const uploadedFilePaths = req.files ? req.files.map(file => {
      // Create URL path for the uploaded file
      return `${process.env.API_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
    }) : [];
    
    // Combine URL images and uploaded file paths
    const allImages = [...imageUrls, ...uploadedFilePaths];
    
    // Extract other fields from the request
    const { brand, model, serialNumber, description } = req.body;
    
    // Use the frontend URL structure for QR code
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = `${frontendBaseUrl}/laptop/serial/${serialNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Create new laptop object
    const newLaptop = new Laptop({
      brand,
      model,
      serialNumber,
      qrCode,
      description,
      specs,
      images: allImages
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
router.put('/:id', authenticate, isAdmin, upload.array('files', 10), async (req, res) => {
  try {
    // Parse JSON strings from form data
    const specs = req.body.specs ? JSON.parse(req.body.specs) : {};
    const imageUrls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
    
    // Get uploaded file paths
    const uploadedFilePaths = req.files ? req.files.map(file => {
      // Create URL path for the uploaded file
      return `${process.env.API_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
    }) : [];
    
    // Combine URL images and uploaded file paths
    const allImages = [...imageUrls, ...uploadedFilePaths];
    
    const { brand, model, serialNumber, description } = req.body;
    
    // Generowanie nowego QR kodu jeśli numer seryjny się zmienił
    let qrCode = null;
    const existingLaptop = await Laptop.findById(req.params.id);
    if (!existingLaptop) {
       return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    
    if (serialNumber && existingLaptop.serialNumber !== serialNumber) {
       // Use the frontend URL structure
       const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
       const qrData = `${frontendBaseUrl}/laptop/serial/${serialNumber}`;
       qrCode = await QRCode.toDataURL(qrData);
    }

    const updateData = {
      brand,
      model,
      serialNumber,
      description,
      specs,
      images: allImages
    };

    // Add QR code to update data only if it was changed
    if (qrCode) {
      updateData.qrCode = qrCode;
    }

    const updatedLaptop = await Laptop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedLaptop) {
      return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    res.json(updatedLaptop);
  } catch (error) {
    console.error('Błąd aktualizacji laptopa:', error);
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

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;
