// controllers/moduleRolePermissionController/module.controller.js
const { ModuleService } = require('../../services/moduleRolePermissionService');

exports.getModules = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = req.query;
    const result = await ModuleService.getModules({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      sortBy,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mod = await ModuleService.getModuleById(id);
    return res.status(200).json({ success: true, data: mod });
  } catch (error) {
    next(error);
  }
};

exports.createModule = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const newModule = await ModuleService.createModule(req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Module created successfully.',
      data: newModule,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ModuleService.updateModule(id, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleModuleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ModuleService.toggleModuleStatus(id, actorId);
    return res.status(200).json({
      success: true,
      message: `Module status changed to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ModuleService.deleteModule(id, actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
