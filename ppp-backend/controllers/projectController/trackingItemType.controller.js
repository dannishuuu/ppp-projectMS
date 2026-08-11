// controllers/projectController/trackingItemType.controller.js
const TrackingItemTypeService = require('../../services/projectService/trackingItemType.service');

class TrackingItemTypeController {
  /**
   * GET /tracking-item-types
   * Get all tracking item types with pagination and filters
   */
  static async getTrackingItemTypes(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        isActive = true,
        isWbs = null,
        isLeaf = null,
      } = req.query;

      const result = await TrackingItemTypeService.getTrackingItemTypes({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search: search || '',
        isActive: isActive === 'false' ? false : (isActive === 'true' ? true : true),
        isWbs: isWbs === 'true' ? true : (isWbs === 'false' ? false : null),
        isLeaf: isLeaf === 'true' ? true : (isLeaf === 'false' ? false : null),
      });

      res.json({
        success: true,
        data: result,
        message: 'Tracking item types retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve tracking item types',
      });
    }
  }

  /**
   * GET /tracking-item-types/active
   * Get all active tracking item types (for dropdowns)
   */
  static async getActiveTrackingItemTypes(req, res) {
    try {
      const result = await TrackingItemTypeService.getActiveTrackingItemTypes();

      res.json({
        success: true,
        data: result,
        message: 'Active tracking item types retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve active tracking item types',
      });
    }
  }

  /**
   * GET /tracking-item-types/wbs-capable
   * Get WBS-capable tracking item types (parent types)
   */
  static async getWbsCapableTypes(req, res) {
    try {
      const result = await TrackingItemTypeService.getWbsCapableTypes();

      res.json({
        success: true,
        data: result,
        message: 'WBS-capable tracking item types retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve WBS-capable tracking item types',
      });
    }
  }

  /**
   * GET /tracking-item-types/leaf
   * Get leaf tracking item types (final types)
   */
  static async getLeafTypes(req, res) {
    try {
      const result = await TrackingItemTypeService.getLeafTypes();

      res.json({
        success: true,
        data: result,
        message: 'Leaf tracking item types retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve leaf tracking item types',
      });
    }
  }

  /**
   * GET /tracking-item-types/:id
   * Get a single tracking item type by ID
   */
  static async getTrackingItemTypeById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await TrackingItemTypeService.getTrackingItemTypeById(id);

      res.json({
        success: true,
        data: result,
        message: 'Tracking item type retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve tracking item type',
      });
    }
  }

  /**
   * POST /tracking-item-types
   * Create a new tracking item type
   */
  static async createTrackingItemType(req, res) {
    try {
      const {
        code,
        name,
        description,
        isWbs,
        isLeaf,
        sortOrder,
        defaultWeight,
      } = req.body;

      const userId = req.user?.id || null;

      const result = await TrackingItemTypeService.createTrackingItemType(
        {
          code,
          name,
          description,
          isWbs,
          isLeaf,
          sortOrder,
          defaultWeight,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tracking item type created successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create tracking item type',
      });
    }
  }

  /**
   * PUT /tracking-item-types/:id
   * Update a tracking item type
   */
  static async updateTrackingItemType(req, res) {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        description,
        isWbs,
        isLeaf,
        sortOrder,
        defaultWeight,
        isActive,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const userId = req.user?.id || null;

      const result = await TrackingItemTypeService.updateTrackingItemType(
        id,
        {
          code,
          name,
          description,
          isWbs,
          isLeaf,
          sortOrder,
          defaultWeight,
          isActive,
        },
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Tracking item type updated successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update tracking item type',
      });
    }
  }

  /**
   * DELETE /tracking-item-types/:id
   * Delete a tracking item type (soft delete)
   */
  static async deleteTrackingItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const userId = req.user?.id || null;

      const result = await TrackingItemTypeService.deleteTrackingItemType(id, userId);

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete tracking item type',
      });
    }
  }

  /**
   * POST /tracking-item-types/:id/restore
   * Restore a deleted tracking item type
   */
  static async restoreTrackingItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const result = await TrackingItemTypeService.restoreTrackingItemType(id);

      res.json({
        success: true,
        data: result,
        message: 'Tracking item type restored successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to restore tracking item type',
      });
    }
  }

  /**
   * GET /tracking-item-types/:id/can-have-children
   * Check if a type can have children
   */
  static async canHaveChildren(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const canHave = await TrackingItemTypeService.canHaveChildren(id);

      res.json({
        success: true,
        data: { id, canHaveChildren: canHave },
        message: 'Check completed successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to check if type can have children',
      });
    }
  }

  /**
   * GET /tracking-item-types/:id/is-leaf
   * Check if a type is a leaf node
   */
  static async isLeafNode(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const isLeaf = await TrackingItemTypeService.isLeafNode(id);

      res.json({
        success: true,
        data: { id, isLeaf },
        message: 'Check completed successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to check if type is leaf',
      });
    }
  }

  /**
   * GET /tracking-item-types/:id/default-weight
   * Get default weight for a type
   */
  static async getDefaultWeight(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID is required',
        });
      }

      const weight = await TrackingItemTypeService.getDefaultWeight(id);

      res.json({
        success: true,
        data: { id, defaultWeight: weight },
        message: 'Default weight retrieved successfully',
      });
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to retrieve default weight',
      });
    }
  }
}

module.exports = TrackingItemTypeController;
