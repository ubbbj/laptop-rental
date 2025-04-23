require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const laptopRoutes = require('./routes/laptops');
const { router: authRouter, authenticate, isAdmin } = require('./routes/auth');
const rentalRoutes = require('./routes/rentals');

// Inicjalizacja aplikacji Express
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve static files from uploads directory at root level
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfiguracja dozwolonych źródeł
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Połączenie z MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Użycie routerów
app.use('/api/auth', authRouter);

// Używamy laptopRoutes dla wszystkich tras /api/laptops
app.use('/api/laptops', laptopRoutes);
app.use('/api/rentals', rentalRoutes);

// Endpoint główny
app.get('/', (req, res) => res.send('API is running'));

// Obsługa błędów
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Uruchomienie serwera
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔄 MongoDB connection state: ${mongoose.connection.readyState}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
