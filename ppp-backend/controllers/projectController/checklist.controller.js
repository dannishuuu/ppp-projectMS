// controllers/projectController/checklist.controller.js
const ChecklistService = require('../../services/projectService/checklist.service');

class ChecklistController {
  /**
   * GET /checklists
   * Get all checklists with pagination and filters
   */
  static async getChecklists(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        isActive,
        trackingAreaId = null,
      } = req.query;

      let isActiveValue = null;
      if (isActive === 'true') {
        isActiveValue = true;
      } else if (isActive === 'false') {
        isActiveValue = false;
      }

      const result = await ChecklistService.getChecklists({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search: search || '',
        isActive: isActiveValue,
        trackingAreaId,
      });

      res.json({
        success: true,
        data: result,
        message: 'Checklists retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve checklists',
      });
    }
  }

  /**
   * GET /checklists/tracking-area/:trackingAreaId
   * Get all checklists for a tracking area
   */
  static async getChecklistsByTrackingArea(req, res) {
    try {
      const { trackingAreaId } = req.params;

      if (!trackingAreaId) {
        return res.status(400).json({
          success: false,
          error: 'Tracking area ID is required',
        });
      }

      const result = await ChecklistService.getChecklistsByTrackingArea(trackingAreaId);

      res.json({
        success: true,
        data: result,
        message: 'Checklists retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve checklists',
      });
    }
  }

  /**
   * GET /checklists/:id
   * Get a single checklist by ID
   */
  static async getChecklistById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await ChecklistService.getChecklistById(id);

      res.json({
        success: true,
        data: result,
        message: 'Checklist retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve checklist',
      });
    }
  }

  /**
   * GET /checklists/stats/:trackingAreaId
   * Get completion statistics for a tracking area
   */
  static async getCompletionStats(req, res) {
    try {
      const { trackingAreaId } = req.params;

      if (!trackingAreaId) {
        return res.status(400).json({
          success: false,
          error: 'Tracking area ID is required',
        });
      }

      const result = await ChecklistService.getCompletionStats(trackingAreaId);

      res.json({
        success: true,
        data: result,
        message: 'Completion statistics retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve completion statistics',
      });
    }
  }

  /**
   * POST /checklists
   * Create a new checklist
   */
  static async createChecklist(req, res) {
    try {
      const {
        trackingAreaId,
        name,
        description,
      } = req.body;

      const userId = req.user?.id || null;

      const result = await ChecklistService.createChecklist(
        {
          trackingAreaId,
          name,
          description,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Checklist created successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create checklist',
      });
    }
  }

  /**
   * PUT /checklists/:id
   * Update a checklist
   */
  static async updateChecklist(req, res) {
    try {
      const { id } = req.params;
      const {
        trackingAreaId,
        name,
        description,
        isActive,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const userId = req.user?.id || null;

      const result = await ChecklistService.updateChecklist(
        id,
        {
          trackingAreaId,
          name,
          description,
          isActive,
        },
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Checklist updated successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update checklist',
      });
    }
  }

  /**
   * DELETE /checklists/:id
   * Delete a checklist (soft delete)
   */
  static async deleteChecklist(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const userId = req.user?.id || null;

      const result = await ChecklistService.deleteChecklist(id, userId);

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete checklist',
      });
    }
  }

  /**
   * POST /checklists/:id/restore
   * Restore a deleted checklist
   */
  static async restoreChecklist(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await ChecklistService.restoreChecklist(id);

      res.json({
        success: true,
        data: result,
        message: 'Checklist restored successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to restore checklist',
      });
    }
  }
}

module.exports = ChecklistController;
