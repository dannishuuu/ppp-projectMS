// controllers/moduleRolePermissionController/permission.controller.js
const { PermissionService } = require('../../services/moduleRolePermissionService');

exports.getPermissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 200, search = '', moduleId = null, status = 'all' } = req.query;
    const result = await PermissionService.getPermissions({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      moduleId,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getPermissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permission = await PermissionService.getPermissionById(id);
    return res.status(200).json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

exports.getPermissionsGroupedByModule = async (req, res, next) => {
  try {
    const matrix = await PermissionService.getPermissionsGroupedByModule();
    return res.status(200).json({ success: true, data: matrix });
  } catch (error) {
    next(error);
  }
};

exports.createPermission = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const newPermission = await PermissionService.createPermission(req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Permission created successfully.',
      data: newPermission,
    });
  } catch (error) {
    next(error);
  }
};

exports.batchGenerateForModule = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { moduleId, actionIds } = req.body;

    if (!moduleId || !Array.isArray(actionIds)) {
      return res.status(400).json({
        success: false,
        message: 'moduleId and actionIds array are required.',
      });
    }

    const createdList = await PermissionService.batchGenerateForModule(moduleId, actionIds, actorId);
    return res.status(201).json({
      success: true,
      message: `${createdList.length} permissions generated successfully.`,
      data: createdList,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await PermissionService.updatePermission(id, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: 'Permission updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.togglePermissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await PermissionService.togglePermissionStatus(id, actorId);
    return res.status(200).json({
      success: true,
      message: `Permission status changed to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await PermissionService.deletePermission(id, actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
