const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/upload', fileController.uploadFiles);
router.post('/upload-organization', fileController.uploadOrganizationFiles);
router.delete('/files/:filename', fileController.deleteFile);

module.exports = router;