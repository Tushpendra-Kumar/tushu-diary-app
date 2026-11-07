const bcrypt = require('bcrypt');
const { db } = require('./config/firebase');

const seedAdmin = async () => {
  const adminId = 'admin';
  const plainPassword = 'admin'; // VERY simple for development, change in production
  
  try {
    const querySnapshot = await db.collection('users').where('user_id', '==', adminId).get();
    
    if (!querySnapshot.empty) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const adminUser = {
      full_name: 'Tushu Admin',
      user_id: adminId,
      password: hashedPassword,
      status: 'ACTIVE',
      role: 'ADMIN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.collection('users').add(adminUser);
    console.log('Admin user seeded successfully. User ID: admin, Password: admin');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
