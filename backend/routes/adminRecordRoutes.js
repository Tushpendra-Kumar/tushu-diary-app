const express = require('express');
const router = express.Router();
const {
  getUserRecords,
  getUserTotal,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/recordController');
const { validateRecordCreateUpdate } = require('../middleware/validationMiddleware');

// Routes under /api/admin/users
router.get('/users/:userId/records', getUserRecords);
router.get('/users/:userId/records/total', getUserTotal);
router.post('/users/:userId/records', validateRecordCreateUpdate, createRecord);

// Routes under /api/admin/records
router.get('/records/:id', getRecordById);
router.put('/records/:id', validateRecordCreateUpdate, updateRecord);
router.delete('/records/:id', deleteRecord);

module.exports = router;
