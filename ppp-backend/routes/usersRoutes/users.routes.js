const express = require("express");
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');

const UserController = require('../../controllers/usersController/user.controller');

router.post('/register', authMiddleware, UserController.register);
router.get('/profile', authMiddleware, UserController.getProfile);
router.get('/list', authMiddleware, UserController.getUsers);
router.get('/:id', authMiddleware, UserController.getUserById);
router.put('/:id', authMiddleware, UserController.updateUser);
router.patch('/:id/toggle-status', authMiddleware, UserController.toggleUserStatus);
router.delete('/:id', authMiddleware, UserController.deleteUser);

module.exports = router;
