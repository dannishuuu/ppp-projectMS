const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proposals/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - allow common document types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif)$/i;
  const allowedMimetypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimetypes.includes(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only document files (PDF, Word, Excel, PowerPoint, and images) are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
}).array('files', 5); // Allow up to 5 files

exports.uploadFiles = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Maximum 5 files allowed' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));
    
    res.status(200).json({ success: true, data: uploadedFiles });
  });
};

exports.deleteFile = (req, res, next) => {
  const fs = require('fs');
  const filePath = req.params.filename;
  const fullPath = path.join(__dirname, '../uploads/proposals', filePath);
  
  fs.unlink(fullPath, (err) => {
    if (err) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(200).json({ success: true, message: 'File deleted successfully' });
  });
};