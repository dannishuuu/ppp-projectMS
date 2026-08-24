const WoredaModel = require('../../models/woreda.model');

class WoredaService {
  static async getWoredas(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', zoneId } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await WoredaModel.findAll({ limit, offset, search, isActive, zoneId });
    return { woredas: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getWoredaById(id) {
    const woreda = await WoredaModel.findById(id);
    if (!woreda) { const err = new Error('Woreda not found.'); err.status = 404; throw err; }
    return woreda;
  }

  static async createWoreda(payload, actorId) {
    const { zoneId, name } = payload;
    if (!zoneId) { const err = new Error('Zone ID is required.'); err.status = 400; throw err; }
    if (!name || !name.trim()) { const err = new Error('Woreda name is required.'); err.status = 400; throw err; }

    const existing = await WoredaModel.findByName(name.trim(), zoneId);
    if (existing) { const err = new Error(`Woreda "${name.trim()}" already exists in this zone.`); err.status = 409; throw err; }

    return WoredaModel.create({ zoneId, name: name.trim(), createdBy: actorId });
  }

  static async updateWoreda(id, payload, actorId) {
    await this.getWoredaById(id);
    const { zoneId, name } = payload;

    if (name && name.trim() && zoneId) {
      const existing = await WoredaModel.findByName(name.trim(), zoneId, id);
      if (existing) { const err = new Error(`Woreda "${name.trim()}" already exists in this zone.`); err.status = 409; throw err; }
    }

    const updated = await WoredaModel.update(id, {
      zoneId: zoneId || undefined,
      name: name ? name.trim() : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getWoredaById(id);
  }

  static async toggleWoredaStatus(id, actorId) {
    const woreda = await this.getWoredaById(id);
    const result = await WoredaModel.update(id, { isActive: !woreda.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Woreda "${woreda.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteWoreda(id, actorId) {
    const woreda = await this.getWoredaById(id);
    const hasProjects = await WoredaModel.hasProjects(id);
    if (hasProjects) { const err = new Error(`Cannot delete woreda "${woreda.name}" because it has active projects assigned to it.`); err.status = 409; throw err; }
    
    await WoredaModel.softDelete(id, actorId);
    return { message: `Woreda "${woreda.name}" has been deleted successfully.` };
  }
}
module.exports = WoredaService;