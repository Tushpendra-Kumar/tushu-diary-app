const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} = require('../controllers/adminUserController');
const { validateUserCreate } = require('../middleware/validationMiddleware');

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', validateUserCreate, createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
