// controllers/moduleRolePermissionController/userRole.controller.js
const { UserRoleService } = require('../../services/moduleRolePermissionService');

exports.getUserRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const roles = await UserRoleService.getUserRoles(userId);
    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

exports.assignRolesToUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body;
    const actorId = req.user?.id;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        message: 'roleIds must be an array of role IDs.',
      });
    }

    const assignedRoles = await UserRoleService.assignRolesToUser(userId, roleIds, actorId);
    return res.status(200).json({
      success: true,
      message: 'User roles updated successfully.',
      data: assignedRoles,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeRoleFromUser = async (req, res, next) => {
  try {
    const { userId, roleId } = req.params;
    const actorId = req.user?.id;
    const result = await UserRoleService.removeRoleFromUser(userId, roleId, actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.getUserPermissionsAndRoles = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    const resolved = await UserRoleService.getUserPermissionsAndRoles(userId);
    return res.status(200).json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
};
