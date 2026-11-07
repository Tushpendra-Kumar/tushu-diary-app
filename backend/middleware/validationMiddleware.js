/**
 * Validation Middleware
 * Reusable validation blocks to ensure data integrity and prevent basic injection payloads.
 */

const validateUserCreate = (req, res, next) => {
  const { fullName, userId } = req.body;
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return res.status(400).json({ success: false, message: 'Valid Full Name is required.' });
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ success: false, message: 'Valid User ID is required.' });
  }
  next();
};

const validateRecordCreateUpdate = (req, res, next) => {
  const { title, amount, date } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Valid Title is required.' });
  }
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
  }
  
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'Valid date is required.' });
  }

  next();
};

module.exports = {
  validateUserCreate,
  validateRecordCreateUpdate
};
