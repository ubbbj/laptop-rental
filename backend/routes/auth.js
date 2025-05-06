const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// Stałe dla tokenów
const ACCESS_TOKEN_EXPIRY = 15 * 60;
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60;

// Rejestracja nowego użytkownika
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY, 
      user: { 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd logowania' });
  }
});

// Endpoint do odświeżania tokenu dostępu
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Brak tokenu odświeżania' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    const user = await User.findOne({ _id: decoded.userId, refreshToken });
    
    if (!user) {
      return res.status(403).json({ message: 'Nieprawidłowy token odświeżania' });
    }
    
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    res.json({ 
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: { 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Błąd odświeżania tokenu:', error);
    res.status(403).json({ message: 'Nieprawidłowy token odświeżania' });
  }
});

// Endpoint do wylogowania
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(200).json({ message: 'Wylogowano pomyślnie' });
  }
  
  try {
    await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });
    res.status(200).json({ message: 'Wylogowano pomyślnie' });
  } catch (error) {
    console.error('Błąd wylogowania:', error);
    res.status(500).json({ message: 'Błąd wylogowania' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Brak tokenu autentykacji',
      code: 'token_missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token wygasł', 
        code: 'token_expired'
      });
    }
    res.status(401).json({ 
      message: 'Nieprawidłowy token', 
      code: 'token_invalid' 
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Brak uprawnień administratora' });
  }
  next();
};

// Endpoint do sprawdzania ważności tokena dostępowego
router.get('/verify', authenticate, (req, res) => {
  res.status(200).json({ 
    valid: true, 
    user: { 
      email: req.user.email, 
      role: req.user.role 
    } 
  });
});

module.exports = { router, authenticate, isAdmin };