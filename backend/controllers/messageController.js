
const { db } = require('../config/firebase');

// User sends a message to Admin
const sendMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const newMessage = {
      userId: req.user.id,
      user_id: req.user.user_id, // alphanumeric user id
      subject,
      message,
      status: 'UNREAD',
      adminReply: null,
      createdAt: new Date().toISOString(),
      repliedAt: null,
    };

    const docRef = await db.collection('contact_messages').add(newMessage);
    res.json({ success: true, data: { id: docRef.id, ...newMessage } });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// User gets their own messages
const getUserMessages = async (req, res) => {
  try {
    const snapshot = await db.collection('contact_messages')
      .where('userId', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();
      
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: messages });
  } catch (error) {
    // If index is missing, return simple get and sort in memory
    try {
        const snapshot = await db.collection('contact_messages').where('userId', '==', req.user.id).get();
        let messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        messages.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, data: messages });
    } catch(e2) {
        console.error('Error fetching user messages:', e2);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};

// Admin gets all messages
const getAllMessages = async (req, res) => {
  try {
    const snapshot = await db.collection('contact_messages').orderBy('createdAt', 'desc').get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Admin replies to a message
const replyMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;
    
    if (!adminReply) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const docRef = db.collection('contact_messages').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await docRef.update({
      adminReply,
      status: 'REPLIED',
      repliedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  sendMessage,
  getUserMessages,
  getAllMessages,
  replyMessage
};
