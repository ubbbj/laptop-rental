require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('./models/User');
const mongoose = require('mongoose');

async function createAdmin() {
  try {
    // Połączenie z MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Dane admina
    const adminEmail = 'admin@laptop.com';
    const adminPassword = 'admin123';
    
    // Sprawdzenie czy admin już istnieje
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin);
      return process.exit(0);
    }

    // Hashowanie hasła
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Tworzenie admina z wyraźnie ustawioną rolą
    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin' // Explicitnie ustawiamy rolę admin
    });

    await admin.save();
    console.log('Admin created successfully:', {
      email: admin.email,
      role: admin.role,
      _id: admin._id
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();