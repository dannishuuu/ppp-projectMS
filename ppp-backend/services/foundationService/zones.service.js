const ZoneModel = require('../../models/zone.model');

class ZoneService {
  static async getZones(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', regionId } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await ZoneModel.findAll({ limit, offset, search, isActive, regionId });
    return { zones: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getZoneById(id) {
    const zone = await ZoneModel.findById(id);
    if (!zone) { const err = new Error('Zone not found.'); err.status = 404; throw err; }
    return zone;
  }

  static async createZone(payload, actorId) {
    const { regionId, name } = payload;
    if (!regionId) { const err = new Error('Region ID is required.'); err.status = 400; throw err; }
    if (!name || !name.trim()) { const err = new Error('Zone name is required.'); err.status = 400; throw err; }

    const existing = await ZoneModel.findByName(name.trim(), regionId);
    if (existing) { const err = new Error(`Zone "${name.trim()}" already exists in this region.`); err.status = 409; throw err; }

    return ZoneModel.create({ regionId, name: name.trim(), createdBy: actorId });
  }

  static async updateZone(id, payload, actorId) {
    await this.getZoneById(id);
    const { regionId, name } = payload;

    if (name && name.trim() && regionId) {
      const existing = await ZoneModel.findByName(name.trim(), regionId, id);
      if (existing) { const err = new Error(`Zone "${name.trim()}" already exists in this region.`); err.status = 409; throw err; }
    }

    const updated = await ZoneModel.update(id, {
      regionId: regionId || undefined,
      name: name ? name.trim() : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getZoneById(id);
  }

  static async toggleZoneStatus(id, actorId) {
    const zone = await this.getZoneById(id);
    const result = await ZoneModel.update(id, { isActive: !zone.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Zone "${zone.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteZone(id, actorId) {
    const zone = await this.getZoneById(id);
    const hasWoredas = await ZoneModel.hasWoredas(id);
    if (hasWoredas) { const err = new Error(`Cannot delete zone "${zone.name}" because it has active woredas assigned to it.`); err.status = 409; throw err; }
    
    await ZoneModel.softDelete(id, actorId);
    return { message: `Zone "${zone.name}" has been deleted successfully.` };
  }
}
module.exports = ZoneService;