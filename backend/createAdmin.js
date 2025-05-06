require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('./models/User');
const mongoose = require('mongoose');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@laptop.com';
    const adminPassword = 'L@pt0p$Admin#2025';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin);
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin created successfully:', {
      email: admin.email,
      role: admin.role,
      _id: admin._id
    });
    console.log('WAŻNE: Zapisz te dane logowania administratora:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Hasło: ${adminPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();