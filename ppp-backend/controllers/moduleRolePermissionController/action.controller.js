// controllers/moduleRolePermissionController/action.controller.js
const { ActionService } = require('../../services/moduleRolePermissionService');

exports.getActions = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = req.query;
    const result = await ActionService.getActions({
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

exports.getActionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const action = await ActionService.getActionById(id);
    return res.status(200).json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
};

exports.createAction = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const newAction = await ActionService.createAction(req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Action created successfully.',
      data: newAction,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ActionService.updateAction(id, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: 'Action updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleActionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ActionService.toggleActionStatus(id, actorId);
    return res.status(200).json({
      success: true,
      message: `Action status changed to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ActionService.deleteAction(id, actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
