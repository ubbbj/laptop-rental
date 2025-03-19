const express = require('express');
const router = express.Router();
const Laptop = require('../models/Laptop');

router.get('/', async (req, res) => {
  const laptops = await Laptop.find();
  res.json(laptops);
});

router.post('/', async (req, res) => {
  const { brand, model, serialNumber, qrCode } = req.body;
  const newLaptop = new Laptop({ brand, model, serialNumber, qrCode });
  await newLaptop.save();
  res.json(newLaptop);
});

module.exports = router;
