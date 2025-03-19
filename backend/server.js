require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const laptopRoutes = require('./routes/laptops');

// Inicjalizacja aplikacji Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Połączenie z MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true, // Poprawiona literówka: useUnifiedTopology zamiast useUnifiedTopology
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Użycie routerów
app.use('/api/laptops', laptopRoutes);

// Endpoint główny
app.get('/', (req, res) => res.send('API is running'));

// Uruchomienie serwera
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));