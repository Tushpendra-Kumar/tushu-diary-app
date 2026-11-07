const { db } = require('../config/firebase');

const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').orderBy('created_at', 'desc').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
  const { fullName, userId, password, status, gender } = req.body;
  
  if (!fullName || !userId) {
    return res.status(400).json({ success: false, message: 'Full Name and User ID are required.' });
  }
  if (!gender) {
    return res.status(400).json({ success: false, message: 'Interface selection is required.' });
  }

  // Set a default password if none is provided
  const plainPassword = password || 'tushu123';

  try {
    // Check if user_id already exists
    const querySnapshot = await db.collection('users').where('user_id', '==', userId).get();
    if (!querySnapshot.empty) {
      return res.status(400).json({ success: false, message: 'User ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const userStatus = status || 'ACTIVE';
    const newUser = {
      full_name: fullName,
      user_id: userId,
      password: hashedPassword,
      status: userStatus,
      role: 'USER',
      gender: gender,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('users').add(newUser);
    
    // Don't send password back in response
    const { password: _, ...userResponse } = newUser;
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...userResponse
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, status } = req.body;

  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Full Name is required.' });
  }

  try {
    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await userRef.update({
      full_name: fullName,
      status: status,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  try {
    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await userRef.update({
      status: status,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await userRef.delete();
    
    // Also delete associated records (Cascade delete)
    const recordsSnapshot = await db.collection('records').where('user_id', '==', id).get();
    const batch = db.batch();
    recordsSnapshot.docs.forEach((recordDoc) => {
      batch.delete(recordDoc.ref);
    });
    await batch.commit();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
};
