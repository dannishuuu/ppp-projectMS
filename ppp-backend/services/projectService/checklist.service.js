// services/projectService/checklist.service.js
const ChecklistModel = require('../../models/checklist.model');
const TrackingAreaModel = require('../../models/trackingArea.model');

class ChecklistService {
  /**
   * Get all checklists with pagination and filters
   * @param {object} options - { page, limit, search, isActive, trackingAreaId, isCompleted }
   */
  static async getChecklists(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = null,
      trackingAreaId = null,
    } = options;

    const offset = (page - 1) * limit;

    const { rows, total } = await ChecklistModel.findAll({
      limit,
      offset,
      search,
      isActive,
      trackingAreaId,
    });

    return {
      checklists: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single checklist by ID
   */
  static async getChecklistById(id) {
    const checklist = await ChecklistModel.findById(id);

    if (!checklist) {
      const err = new Error('Checklist not found.');
      err.status = 404;
      throw err;
    }

    return checklist;
  }

  /**
   * Get all checklists for a tracking area
   */
  static async getChecklistsByTrackingArea(trackingAreaId) {
    // Verify tracking area exists
    const area = await TrackingAreaModel.findById(trackingAreaId);
    if (!area) {
      const err = new Error('Tracking area not found.');
      err.status = 404;
      throw err;
    }

    return await ChecklistModel.getByTrackingAreaId(trackingAreaId);
  }

  /**
   * Create a new checklist
   */
  static async createChecklist(payload, actorId) {
    const {
      trackingAreaId,
      name,
      description,
    } = payload;

    // Validation
    if (!trackingAreaId) {
      const err = new Error('Tracking area ID is required.');
      err.status = 400;
      throw err;
    }

    if (!name || !name.trim()) {
      const err = new Error('Name is required.');
      err.status = 400;
      throw err;
    }

    // Verify tracking area exists
    const area = await TrackingAreaModel.findById(trackingAreaId);
    if (!area) {
      const err = new Error('Tracking area not found.');
      err.status = 404;
      throw err;
    }

    // Check if name already exists within the same tracking area
    const existingChecklist = await ChecklistModel.findByName(name.trim(), trackingAreaId);
    if (existingChecklist) {
      const err = new Error(`A checklist with name '${name.trim()}' already exists in this tracking area.`);
      err.status = 409;
      throw err;
    }

    const created = await ChecklistModel.create({
      trackingAreaId,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: actorId,
    });

    return created;
  }

  /**
   * Update an existing checklist
   */
  static async updateChecklist(id, payload, actorId) {
    await this.getChecklistById(id); // Verify exists

    const {
      trackingAreaId,
      name,
      description,
      isActive,
    } = payload;

    // Validate if name is being changed
    if (name) {
      const nameTrimmed = name.trim();
      const existingChecklist = await ChecklistModel.findByName(nameTrimmed, trackingAreaId || (await ChecklistModel.findById(id)).tracking_area_id, id);
      if (existingChecklist) {
        const err = new Error(`A checklist with name '${nameTrimmed}' already exists in this tracking area.`);
        err.status = 409;
        throw err;
      }
    }

    // If tracking area is being changed, verify it exists
    if (trackingAreaId) {
      const area = await TrackingAreaModel.findById(trackingAreaId);
      if (!area) {
        const err = new Error('Tracking area not found.');
        err.status = 404;
        throw err;
      }
    }

    const updated = await ChecklistModel.update(id, {
      trackingAreaId,
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
   * Delete a checklist (soft delete)
   */
  static async deleteChecklist(id, actorId) {
    const checklist = await this.getChecklistById(id);

    await ChecklistModel.softDelete(id, actorId);

    return { message: `Checklist '${checklist.name}' deleted successfully.` };
  }

  /**
   * Restore a deleted checklist
   */
  static async restoreChecklist(id) {
    const result = await ChecklistModel.restore(id);

    if (!result) {
      const err = new Error('Checklist not found or not deleted.');
      err.status = 404;
      throw err;
    }

    return result;
  }
}

module.exports = ChecklistService;
