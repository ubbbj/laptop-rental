require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const laptopRoutes = require('./routes/laptops');
const { router: authRouter, authenticate, isAdmin } = require('./routes/auth');
const rentalRoutes = require('./routes/rentals');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
  : ['http://localhost:3000'];
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

app.use('/api/auth', authRouter);

app.use('/api/laptops', laptopRoutes);
app.use('/api/rentals', rentalRoutes);

app.get('/', (req, res) => {
  res.send({
    name: 'Laptop Rental API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔄 MongoDB connection state: ${mongoose.connection.readyState}`);
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\nServer closed gracefully');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
