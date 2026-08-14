// controllers/projectController/trackingArea.controller.js
const TrackingAreaService = require('../../services/projectService/trackingArea.service');

class TrackingAreaController {
  /**
   * GET /tracking-areas
   * Get all tracking areas with pagination and filters
   */
  static async getTrackingAreas(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        isActive,
        trackingItemTypeId = null,
        parentId = null,
      } = req.query;

      let isActiveValue = null;
      if (isActive === 'true') {
        isActiveValue = true;
      } else if (isActive === 'false') {
        isActiveValue = false;
      }

      // Handle 'null' string for top-level items
      let parentIdValue = parentId;
      if (parentId === 'null') {
        parentIdValue = null;
      }

      const result = await TrackingAreaService.getTrackingAreas({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search: search || '',
        isActive: isActiveValue,
        trackingItemTypeId,
        parentId: parentIdValue,
      });

      res.json({
        success: true,
        data: result,
        message: 'Tracking areas retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve tracking areas',
      });
    }
  }

  /**
   * GET /tracking-areas/pillars
   * Get all pillars (top-level areas)
   */
  static async getPillars(req, res) {
    try {
      const { trackingItemTypeId = null } = req.query;

      const result = await TrackingAreaService.getPillars(trackingItemTypeId);

      res.json({
        success: true,
        data: result,
        message: 'Pillars retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve pillars',
      });
    }
  }

  /**
   * GET /tracking-areas/phases
   * Get all phases (child areas)
   */
  static async getPhases(req, res) {
    try {
      const { parentId = null } = req.query;

      const result = await TrackingAreaService.getPhases(parentId);

      res.json({
        success: true,
        data: result,
        message: 'Phases retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve phases',
      });
    }
  }

  /**
   * GET /tracking-areas/hierarchy
   * Get full hierarchy
   */
  static async getHierarchy(req, res) {
    try {
      const { trackingItemTypeId = null } = req.query;

      const result = await TrackingAreaService.getHierarchy(trackingItemTypeId);

      res.json({
        success: true,
        data: result,
        message: 'Hierarchy retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve hierarchy',
      });
    }
  }

  /**
   * GET /tracking-areas/:id
   * Get a single tracking area by ID
   */
  static async getTrackingAreaById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await TrackingAreaService.getTrackingAreaById(id);

      res.json({
        success: true,
        data: result,
        message: 'Tracking area retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve tracking area',
      });
    }
  }

  /**
   * GET /tracking-areas/:id/children
   * Get children of a tracking area
   */
  static async getChildren(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await TrackingAreaService.getChildren(id);

      res.json({
        success: true,
        data: result,
        message: 'Children retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve children',
      });
    }
  }

  /**
   * POST /tracking-areas
   * Create a new tracking area
   */
  static async createTrackingArea(req, res) {
    try {
      const {
        trackingItemTypeId,
        parentId,
        name,
        description,
      } = req.body;

      const userId = req.user?.id || null;

      const result = await TrackingAreaService.createTrackingArea(
        {
          trackingItemTypeId,
          parentId,
          name,
          description,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tracking area created successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create tracking area',
      });
    }
  }

  /**
   * PUT /tracking-areas/:id
   * Update a tracking area
   */
  static async updateTrackingArea(req, res) {
    try {
      const { id } = req.params;
      const {
        trackingItemTypeId,
        parentId,
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

      const result = await TrackingAreaService.updateTrackingArea(
        id,
        {
          trackingItemTypeId,
          parentId,
          name,
          description,
          isActive,
        },
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Tracking area updated successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update tracking area',
      });
    }
  }

  /**
   * DELETE /tracking-areas/:id
   * Delete a tracking area (soft delete)
   */
  static async deleteTrackingArea(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const userId = req.user?.id || null;

      const result = await TrackingAreaService.deleteTrackingArea(id, userId);

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete tracking area',
      });
    }
  }

  /**
   * POST /tracking-areas/:id/restore
   * Restore a deleted tracking area
   */
  static async restoreTrackingArea(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await TrackingAreaService.restoreTrackingArea(id);

      res.json({
        success: true,
        data: result,
        message: 'Tracking area restored successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to restore tracking area',
      });
    }
  }

  /**
   * GET /tracking-areas/:id/has-children
   * Check if an area has children
   */
  static async hasChildren(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const hasChildren = await TrackingAreaService.hasChildren(id);

      res.json({
        success: true,
        data: { id, hasChildren },
        message: 'Check completed successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to check if area has children',
      });
    }
  }

  /**
   * GET /tracking-areas/:id/has-checklists
   * Check if an area has checklists
   */
  static async hasChecklists(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const hasChecklists = await TrackingAreaService.hasChecklists(id);

      res.json({
        success: true,
        data: { id, hasChecklists },
        message: 'Check completed successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to check if area has checklists',
      });
    }
  }
}

module.exports = TrackingAreaController;
