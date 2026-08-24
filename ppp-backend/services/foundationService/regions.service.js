const RegionModel = require('../../models/region.model');

class RegionService {
  static async getRegions(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', countryId } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await RegionModel.findAll({ limit, offset, search, isActive, countryId });
    return { regions: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getRegionById(id) {
    const region = await RegionModel.findById(id);
    if (!region) { const err = new Error('Region not found.'); err.status = 404; throw err; }
    return region;
  }

  static async createRegion(payload, actorId) {
    const { countryId, name, code } = payload;
    if (!countryId) { const err = new Error('Country ID is required.'); err.status = 400; throw err; }
    if (!name || !name.trim()) { const err = new Error('Region name is required.'); err.status = 400; throw err; }

    const existing = await RegionModel.findByName(name.trim(), countryId);
    if (existing) { const err = new Error(`Region "${name.trim()}" already exists in this country.`); err.status = 409; throw err; }

    return RegionModel.create({ countryId, name: name.trim(), code: code?.trim() || null, createdBy: actorId });
  }

  static async updateRegion(id, payload, actorId) {
    await this.getRegionById(id);
    const { countryId, name, code } = payload;

    if (name && name.trim() && countryId) {
      const existing = await RegionModel.findByName(name.trim(), countryId, id);
      if (existing) { const err = new Error(`Region "${name.trim()}" already exists in this country.`); err.status = 409; throw err; }
    }

    const updated = await RegionModel.update(id, {
      countryId: countryId || undefined,
      name: name ? name.trim() : undefined,
      code: code !== undefined ? (code ? code.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getRegionById(id);
  }

  static async toggleRegionStatus(id, actorId) {
    const region = await this.getRegionById(id);
    const result = await RegionModel.update(id, { isActive: !region.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Region "${region.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteRegion(id, actorId) {
    const region = await this.getRegionById(id);
    const hasZones = await RegionModel.hasZones(id);
    if (hasZones) { const err = new Error(`Cannot delete region "${region.name}" because it has active zones assigned to it.`); err.status = 409; throw err; }
    
    await RegionModel.softDelete(id, actorId);
    return { message: `Region "${region.name}" has been deleted successfully.` };
  }
}
module.exports = RegionService;