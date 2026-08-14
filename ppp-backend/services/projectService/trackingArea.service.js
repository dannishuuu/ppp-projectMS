// services/projectService/trackingArea.service.js
const TrackingAreaModel = require('../../models/trackingArea.model');
const TrackingItemTypeModel = require('../../models/trackingItemType.model');

class TrackingAreaService {
  /**
   * Get all tracking areas with pagination and filters
   * @param {object} options - { page, limit, search, isActive, trackingItemTypeId, parentId }
   */
  static async getTrackingAreas(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = null,
      trackingItemTypeId = null,
      parentId = null,
    } = options;

    const offset = (page - 1) * limit;

    const { rows, total } = await TrackingAreaModel.findAll({
      limit,
      offset,
      search,
      isActive,
      trackingItemTypeId,
      parentId,
    });

    return {
      trackingAreas: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single tracking area by ID
   */
  static async getTrackingAreaById(id) {
    const area = await TrackingAreaModel.findById(id);

    if (!area) {
      const err = new Error('Tracking area not found.');
      err.status = 404;
      throw err;
    }

    return area;
  }

  /**
   * Get all pillars (top-level areas)
   */
  static async getPillars(trackingItemTypeId = null) {
    return await TrackingAreaModel.getPillars(trackingItemTypeId);
  }

  /**
   * Get all phases (child areas)
   */
  static async getPhases(parentId = null) {
    return await TrackingAreaModel.getPhases(parentId);
  }

  /**
   * Get children of a tracking area
   */
  static async getChildren(parentId) {
    await this.getTrackingAreaById(parentId); // Verify exists
    return await TrackingAreaModel.getChildren(parentId);
  }

  /**
   * Get full hierarchy
   */
  static async getHierarchy(trackingItemTypeId = null) {
    return await TrackingAreaModel.getHierarchy(trackingItemTypeId);
  }

  /**
   * Create a new tracking area
   */
  static async createTrackingArea(payload, actorId) {
    const {
      trackingItemTypeId,
      parentId,
      name,
      description,
    } = payload;

    // Normalize parentId: convert empty string to null
    const normalizedParentId = parentId === '' ? null : parentId;

    // Validation
    if (!trackingItemTypeId) {
      const err = new Error('Tracking item type ID is required.');
      err.status = 400;
      throw err;
    }

    if (!name || !name.trim()) {
      const err = new Error('Name is required.');
      err.status = 400;
      throw err;
    }

    // Verify tracking item type exists
    const itemType = await TrackingItemTypeModel.findById(trackingItemTypeId);
    if (!itemType) {
      const err = new Error('Tracking item type not found.');
      err.status = 404;
      throw err;
    }

    // If parentId is provided, verify it exists
    if (normalizedParentId) {
      const parent = await TrackingAreaModel.findById(normalizedParentId);
      if (!parent) {
        const err = new Error('Parent tracking area not found.');
        err.status = 404;
        throw err;
      }
    }

    // Check if name already exists within the same parent scope
    const existingArea = await TrackingAreaModel.findByName(name.trim(), normalizedParentId);
    if (existingArea) {
      const err = new Error(`A tracking area with name '${name.trim()}' already exists in this scope.`);
      err.status = 409;
      throw err;
    }

    const created = await TrackingAreaModel.create({
      trackingItemTypeId,
      parentId: normalizedParentId,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: actorId,
    });

    return created;
  }

  /**
   * Update an existing tracking area
   */
  static async updateTrackingArea(id, payload, actorId) {
    await this.getTrackingAreaById(id); // Verify exists

    const {
      trackingItemTypeId,
      parentId,
      name,
      description,
      isActive,
    } = payload;

    // Normalize parentId: convert empty string to null
    const normalizedParentId = parentId === '' ? null : parentId;

    // If tracking item type is being changed, verify it exists
    if (trackingItemTypeId) {
      const itemType = await TrackingItemTypeModel.findById(trackingItemTypeId);
      if (!itemType) {
        const err = new Error('Tracking item type not found.');
        err.status = 404;
        throw err;
      }
    }

    // If parentId is being changed, verify it exists and not creating a cycle
    if (parentId !== undefined) {
      if (normalizedParentId === id) {
        const err = new Error('A tracking area cannot be its own parent.');
        err.status = 400;
        throw err;
      }

      if (normalizedParentId) {
        const parent = await TrackingAreaModel.findById(normalizedParentId);
        if (!parent) {
          const err = new Error('Parent tracking area not found.');
          err.status = 404;
          throw err;
        }
      }
    }

    // Validate if name is being changed
    if (name) {
      const nameTrimmed = name.trim();
      const currentArea = await TrackingAreaModel.findById(id);
      const existingArea = await TrackingAreaModel.findByName(
        nameTrimmed, 
        parentId !== undefined ? normalizedParentId : currentArea.parent_id, 
        id
      );
      if (existingArea) {
        const err = new Error(`A tracking area with name '${nameTrimmed}' already exists in this scope.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await TrackingAreaModel.update(id, {
      trackingItemTypeId,
      parentId: normalizedParentId,
      name: name ? name.trim() : undefined,
      description: description ? description.trim() : undefined,
      isActive,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return updated;
  }

  /**
   * Delete a tracking area (soft delete)
   */
  static async deleteTrackingArea(id, actorId) {
    const area = await this.getTrackingAreaById(id);

    // Check if area has children
    const hasChildren = await TrackingAreaModel.hasChildren(id);
    if (hasChildren) {
      const err = new Error('Cannot delete tracking area with children. Delete children first or reassign them.');
      err.status = 400;
      throw err;
    }

    await TrackingAreaModel.softDelete(id, actorId);

    return { message: `Tracking area '${area.name}' deleted successfully.` };
  }

  /**
   * Restore a deleted tracking area
   */
  static async restoreTrackingArea(id) {
    const result = await TrackingAreaModel.restore(id);

    if (!result) {
      const err = new Error('Tracking area not found or not deleted.');
      err.status = 404;
      throw err;
    }

    return result;
  }

  /**
   * Check if an area has children
   */
  static async hasChildren(id) {
    await this.getTrackingAreaById(id); // Verify exists
    return await TrackingAreaModel.hasChildren(id);
  }

  /**
   * Check if an area has checklists
   */
  static async hasChecklists(id) {
    await this.getTrackingAreaById(id); // Verify exists
    return await TrackingAreaModel.hasChecklists(id);
  }
}

module.exports = TrackingAreaService;
