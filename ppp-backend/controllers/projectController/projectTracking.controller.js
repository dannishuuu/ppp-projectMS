// controllers/projectController/projectTracking.controller.js
const ProjectTrackingService = require('../../services/projectService/projectTracking.service');

exports.getProjectWbsTree = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const tree = await ProjectTrackingService.getProjectWbsTree(projectId);
    return res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

exports.initializeProjectWbs = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { projectId } = req.params;
    const result = await ProjectTrackingService.initializeProjectWbs(projectId, req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Project WBS initialized successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTypeWeights = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { projectId } = req.params;
    const { items } = req.body; // array of { id, weight }
    const updated = await ProjectTrackingService.updateTypeWeights(projectId, items, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.updateAreaWeights = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { projectTrackingTypeId } = req.params;
    const { items } = req.body; // array of { id, weight }
    const updated = await ProjectTrackingService.updateAreaWeights(projectTrackingTypeId, items, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.updateChecklistWeights = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { projectTrackingAreaId } = req.params;
    const { items } = req.body; // array of { id, weight }
    const updated = await ProjectTrackingService.updateChecklistWeights(projectTrackingAreaId, items, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleChecklistCompletion = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { checklistId } = req.params;
    const { isCompleted, notes } = req.body;
    const updated = await ProjectTrackingService.toggleChecklistCompletion(checklistId, isCompleted, notes, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.addPerformanceLog = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { checklistId } = req.params;
    const log = await ProjectTrackingService.addPerformanceLog(checklistId, req.body, actorId);
    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

exports.getChecklistLogs = async (req, res, next) => {
  try {
    const { checklistId } = req.params;
    const logs = await ProjectTrackingService.getChecklistLogs(checklistId);
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
