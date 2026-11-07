const { db } = require('../config/firebase');

const getUserRecords = async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('records')
      .where('user_id', '==', userId)
      .get();
      
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory to avoid requiring Firestore composite indexes
    records.sort((a, b) => {
      const dateA = new Date(a.record_date).getTime();
      const dateB = new Date(b.record_date).getTime();
      if (dateA !== dateB) return dateB - dateA; // Primary sort by record_date desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Secondary sort by created_at desc
    });
    
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error getting user records:', error);
    // Note: Firestore requires a composite index for multiple orderBy clauses.
    // If the index is missing, the error message will contain a direct link to create it.
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getUserTotal = async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('records')
      .where('user_id', '==', userId)
      .get();
      
    let total = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.amount && !isNaN(data.amount)) {
        total += parseFloat(data.amount);
      }
    });
    
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error('Error calculating total:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getRecordById = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('records').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error getting record by id:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const createRecord = async (req, res) => {
  const { userId } = req.params;
  const { title, amount, description, date } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'Valid date is required.' });
  }

  try {
    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newRecord = {
      user_id: userId,
      title: title.trim(),
      amount: numericAmount,
      description: description ? description.trim() : null,
      record_date: date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('records').add(newRecord);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newRecord
      }
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateRecord = async (req, res) => {
  const { id } = req.params;
  const { title, amount, description, date } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'Valid date is required.' });
  }

  try {
    const recordRef = db.collection('records').doc(id);
    const doc = await recordRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await recordRef.update({
      title: title.trim(),
      amount: numericAmount,
      description: description ? description.trim() : null,
      record_date: date,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const deleteRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const recordRef = db.collection('records').doc(id);
    const doc = await recordRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await recordRef.delete();
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getUserRecords,
  getUserTotal,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord
};
