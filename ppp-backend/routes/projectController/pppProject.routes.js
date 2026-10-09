// routes/projectController/pppProject.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ProjectController = require('../../controllers/projectController/pppProject.controller');

// Collection routes
router.get('/',                            authMiddleware, ProjectController.getProjects);
router.post('/',                           authMiddleware, ProjectController.createProject);

// Proposal conversion
router.post('/convert-proposal/:proposalId', authMiddleware, ProjectController.convertProposal);

// Single resource routes
router.get('/:id',                         authMiddleware, ProjectController.getProjectById);
router.put('/:id',                         authMiddleware, ProjectController.updateProject);
router.delete('/:id',                      authMiddleware, ProjectController.deleteProject);

// Action routes
router.patch('/:id/change-status',         authMiddleware, ProjectController.changeStatus);

module.exports = router;
