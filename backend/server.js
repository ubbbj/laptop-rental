require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const laptopRoutes = require('./routes/laptops');
app.use('/api/laptops', laptopRoutes);


const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
