const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/authController/login.controller');

// POST /api/v1/login – user authentication
router.post('/login', UserController.login);

// POST /api/v1/refresh-token – token extension / refresh
router.post('/refresh-token', UserController.refreshToken);

module.exports = router;