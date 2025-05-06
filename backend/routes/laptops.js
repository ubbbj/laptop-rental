const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Laptop = require('../models/Laptop');
const router = express.Router();
const { authenticate, isAdmin } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

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
    fileSize: 5 * 1024 * 1024
  }
});

router.post('/', authenticate, isAdmin, upload.array('files', 10), async (req, res) => {
  try {
    const specs = req.body.specs ? JSON.parse(req.body.specs) : {};
    const imageUrls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];

    const uploadedFilePaths = req.files ? req.files.map(file => {
      return `${process.env.API_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
    }) : [];

    const allImages = [...imageUrls, ...uploadedFilePaths];
    
    const { brand, model, serialNumber, description } = req.body;
    
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = `${frontendBaseUrl}/laptop/serial/${serialNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

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

router.get('/', async (req, res) => {
  try {
    const laptops = await Laptop.find();
    res.json(laptops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas pobierania laptopów' });
  }
});

router.get('/:id', async (req, res) => {
  try {
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

router.get('/serial/:serialNumber', async (req, res) => {
  try {
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

router.put('/:id', authenticate, isAdmin, upload.array('files', 10), async (req, res) => {
  try {
    const specs = req.body.specs ? JSON.parse(req.body.specs) : {};
    const imageUrls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
    
    const uploadedFilePaths = req.files ? req.files.map(file => {
      return `${process.env.API_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
    }) : [];
    
    const allImages = [...imageUrls, ...uploadedFilePaths];
    
    const { brand, model, serialNumber, description } = req.body;
    
    let qrCode = null;
    const existingLaptop = await Laptop.findById(req.params.id);
    if (!existingLaptop) {
       return res.status(404).json({ error: 'Laptop nie znaleziony' });
    }
    
    if (serialNumber && existingLaptop.serialNumber !== serialNumber) {
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

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;
