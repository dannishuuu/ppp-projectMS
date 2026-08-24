const BuildingTypeModel = require('../../models/buildingTypes.model');

class BuildingTypeService {
  static async getBuildingTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await BuildingTypeModel.findAll({ limit, offset, search, isActive });
    return { buildingTypes: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getBuildingTypeById(id) {
    const type = await BuildingTypeModel.findById(id);
    if (!type) { const err = new Error('Building type not found.'); err.status = 404; throw err; }
    return type;
  }

  static async createBuildingType(payload, actorId) {
    const { name, description } = payload;
    if (!name || !name.trim()) { const err = new Error('Building type name is required.'); err.status = 400; throw err; }

    const existing = await BuildingTypeModel.findByName(name.trim());
    if (existing) { const err = new Error(`Building type "${name.trim()}" already exists.`); err.status = 409; throw err; }

    return BuildingTypeModel.create({ name: name.trim(), description: description?.trim() || null, createdBy: actorId });
  }

  static async updateBuildingType(id, payload, actorId) {
    await this.getBuildingTypeById(id);
    const { name, description } = payload;

    if (name && name.trim()) {
      const existing = await BuildingTypeModel.findByName(name.trim(), id);
      if (existing) { const err = new Error(`Building type "${name.trim()}" already exists.`); err.status = 409; throw err; }
    }

    const updated = await BuildingTypeModel.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getBuildingTypeById(id);
  }

  static async toggleBuildingTypeStatus(id, actorId) {
    const type = await this.getBuildingTypeById(id);
    const result = await BuildingTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Building type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteBuildingType(id, actorId) {
    const type = await this.getBuildingTypeById(id);
    const hasBuildings = await BuildingTypeModel.hasBuildings(id);
    if (hasBuildings) { const err = new Error(`Cannot delete building type "${type.name}" because it is assigned to active buildings.`); err.status = 409; throw err; }
    
    await BuildingTypeModel.softDelete(id, actorId);
    return { message: `Building type "${type.name}" has been deleted successfully.` };
  }
}
module.exports = BuildingTypeService;