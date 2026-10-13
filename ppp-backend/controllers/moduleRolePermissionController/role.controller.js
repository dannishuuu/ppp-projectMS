// controllers/moduleRolePermissionController/role.controller.js
const { RoleService } = require('../../services/moduleRolePermissionService');

exports.getRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = req.query;
    const result = await RoleService.getRoles({
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

exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await RoleService.getRoleById(id);
    return res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const newRole = await RoleService.createRole(req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      data: newRole,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await RoleService.updateRole(id, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleRoleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await RoleService.toggleRoleStatus(id, actorId);
    return res.status(200).json({
      success: true,
      message: `Role status changed to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await RoleService.deleteRole(id, actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.getRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permissions = await RoleService.getRolePermissions(id);
    return res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

exports.assignPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    const actorId = req.user?.id;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds must be an array of permission IDs.',
      });
    }

    const updatedRole = await RoleService.assignPermissions(id, permissionIds, actorId);
    return res.status(200).json({
      success: true,
      message: 'Role permissions synchronized successfully.',
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  }
};
