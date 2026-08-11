// controllers/projectController/projectCategory.controller.js
const ProjectCategoryService = require('../../services/projectService/projectCategory.service');

// ─── LIST ─────────────────────────────────────────────────────────────────────
// GET /api/v1/project-categories
exports.getProjectCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await ProjectCategoryService.getProjectCategories({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────────────────
// GET /api/v1/project-categories/:id
exports.getProjectCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await ProjectCategoryService.getProjectCategoryById(id);
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
// POST /api/v1/project-categories
exports.createProjectCategory = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const category = await ProjectCategoryService.createProjectCategory(req.body, actorId);
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// PUT /api/v1/project-categories/:id
exports.updateProjectCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ProjectCategoryService.updateProjectCategory(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
// PATCH /api/v1/project-categories/:id/toggle-status
exports.toggleProjectCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProjectCategoryService.toggleProjectCategoryStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
// DELETE /api/v1/project-categories/:id
exports.deleteProjectCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProjectCategoryService.deleteProjectCategory(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
