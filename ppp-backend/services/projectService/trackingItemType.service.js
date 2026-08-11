// services/projectService/trackingItemType.service.js
const TrackingItemTypeModel = require('../../models/trackingItemType.model');

class TrackingItemTypeService {
  /**
   * Get all tracking item types with pagination and filters
   * @param {object} options - { page, limit, search, isActive, isWbs, isLeaf }
   */
  static async getTrackingItemTypes(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = null,
      isWbs = null,
      isLeaf = null,
    } = options;

    const offset = (page - 1) * limit;

    const { rows, total } = await TrackingItemTypeModel.findAll({
      limit,
      offset,
      search,
      isActive,
      isWbs,
      isLeaf,
    });

    return {
      trackingItemTypes: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single tracking item type by ID
   */
  static async getTrackingItemTypeById(id) {
    const itemType = await TrackingItemTypeModel.findById(id);

    if (!itemType) {
      const err = new Error('Tracking item type not found.');
      err.status = 404;
      throw err;
    }

    return itemType;
  }

  /**
   * Get tracking item type by code
   */
  static async getTrackingItemTypeByCode(code) {
    const itemType = await TrackingItemTypeModel.findByCode(code);

    if (!itemType) {
      const err = new Error(`Tracking item type with code '${code}' not found.`);
      err.status = 404;
      throw err;
    }

    return itemType;
  }

  /**
   * Create a new tracking item type
   */
  static async createTrackingItemType(payload, actorId) {
    const {
      code,
      name,
      description,
      isWbs = false,
      isLeaf = false,
    } = payload;

    // Validation
    if (!code || !code.trim()) {
      const err = new Error('Code is required.');
      err.status = 400;
      throw err;
    }

    if (!name || !name.trim()) {
      const err = new Error('Name is required.');
      err.status = 400;
      throw err;
    }

    const codeUpper = code.trim().toUpperCase();

    // Check if code already exists
    if (await TrackingItemTypeModel.codeExists(codeUpper)) {
      const err = new Error(`Code '${codeUpper}' already exists.`);
      err.status = 409;
      throw err;
    }

    // Check if name already exists
    if (await TrackingItemTypeModel.nameExists(name.trim())) {
      const err = new Error(`Name '${name.trim()}' already exists.`);
      err.status = 409;
      throw err;
    }

    // Validate WBS and Leaf constraints
    if (isWbs && isLeaf) {
      const err = new Error('A type cannot be both WBS-capable (parent) and a leaf (final) node.');
      err.status = 400;
      throw err;
    }

    const created = await TrackingItemTypeModel.create({
      code: codeUpper,
      name: name.trim(),
      description: description?.trim() || null,
      isWbs,
      isLeaf,
      createdBy: actorId,
    });

    return created;
  }

  /**
   * Update an existing tracking item type
   */
  static async updateTrackingItemType(id, payload, actorId) {
    await this.getTrackingItemTypeById(id); // Verify exists

    const {
      code,
      name,
      description,
      isWbs,
      isLeaf,
      isActive,
    } = payload;

    // Validate if code is being changed
    if (code) {
      const codeUpper = code.trim().toUpperCase();
      if (await TrackingItemTypeModel.codeExists(codeUpper, id)) {
        const err = new Error(`Code '${codeUpper}' already exists.`);
        err.status = 409;
        throw err;
      }
    }

    // Validate if name is being changed
    if (name) {
      const nameTrimmed = name.trim();
      if (await TrackingItemTypeModel.nameExists(nameTrimmed, id)) {
        const err = new Error(`Name '${nameTrimmed}' already exists.`);
        err.status = 409;
        throw err;
      }
    }

    // Validate WBS and Leaf constraints if both are being updated
    if (isWbs !== undefined && isLeaf !== undefined && isWbs && isLeaf) {
      const err = new Error('A type cannot be both WBS-capable (parent) and a leaf (final) node.');
      err.status = 400;
      throw err;
    }

    const updated = await TrackingItemTypeModel.update(id, {
      code: code ? code.trim().toUpperCase() : undefined,
      name: name ? name.trim() : undefined,
      description: description ? description.trim() : undefined,
      isWbs,
      isLeaf,
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
   * Delete a tracking item type (soft delete)
   */
  static async deleteTrackingItemType(id, actorId) {
    const itemType = await this.getTrackingItemTypeById(id);

    await TrackingItemTypeModel.softDelete(id, actorId);

    return { message: `Tracking item type '${itemType.name}' deleted successfully.` };
  }

  /**
   * Restore a deleted tracking item type
   */
  static async restoreTrackingItemType(id) {
    const result = await TrackingItemTypeModel.restore(id);

    if (!result) {
      const err = new Error('Tracking item type not found or not deleted.');
      err.status = 404;
      throw err;
    }

    return result;
  }

  /**
   * Get all active tracking item types (for dropdowns/UI)
   */
  static async getActiveTrackingItemTypes() {
    return await TrackingItemTypeModel.getActive();
  }

  /**
   * Get WBS-capable tracking item types (parent types)
   */
  static async getWbsCapableTypes() {
    return await TrackingItemTypeModel.getWbsCapable();
  }

  /**
   * Get leaf tracking item types (final types)
   */
  static async getLeafTypes() {
    return await TrackingItemTypeModel.getLeafTypes();
  }

  /**
   * Check if a type can have children (WBS-capable)
   */
  static async canHaveChildren(typeId) {
    const itemType = await this.getTrackingItemTypeById(typeId);
    return itemType.is_wbs;
  }

  /**
   * Check if a type is a leaf node (final)
   */
  static async isLeafNode(typeId) {
    const itemType = await this.getTrackingItemTypeById(typeId);
    return itemType.is_leaf;
  }
}

module.exports = TrackingItemTypeService;
