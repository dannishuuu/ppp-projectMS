const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/upload', fileController.uploadFiles);
router.delete('/files/:filename', fileController.deleteFile);

module.exports = router;