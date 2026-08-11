// routes/projectController/projectCategory.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const CategoryController = require('../../controllers/projectController/projectCategory.controller');

// ─── Collection routes ────────────────────────────────────────────────────────
router.get('/',     authMiddleware, CategoryController.getProjectCategories);
router.post('/',    authMiddleware, CategoryController.createProjectCategory);

// ─── Member routes ────────────────────────────────────────────────────────────
router.get('/:id',                    authMiddleware, CategoryController.getProjectCategoryById);
router.put('/:id',                    authMiddleware, CategoryController.updateProjectCategory);
router.patch('/:id/toggle-status',    authMiddleware, CategoryController.toggleProjectCategoryStatus);
router.delete('/:id',                 authMiddleware, CategoryController.deleteProjectCategory);

module.exports = router;
