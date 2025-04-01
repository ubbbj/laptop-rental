const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// Rejestracja nowego użytkownika
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sprawdzenie czy użytkownik już istnieje
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik już istnieje' });
    }

    // Hashowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Utworzenie nowego użytkownika - domyślnie rola 'user'
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Użytkownik zarejestrowany' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd rejestracji' });
  }
});

// Logowanie
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Znalezienie użytkownika
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Sprawdzenie hasła
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Generowanie tokena JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd logowania' });
  }
});

// Middleware do sprawdzania autentykacji
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Brak tokena autentykacji' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};

// Middleware do sprawdzania roli admina
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Brak uprawnień administratora' });
  }
  next();
};

module.exports = { router, authenticate, isAdmin };