const ShopServiceTypeModel = require('../../models/shopServiceType.model');

class ShopServiceTypeService {
  static async getShopServiceTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await ShopServiceTypeModel.findAll({ limit, offset, search, isActive });
    return { shopServiceTypes: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getShopServiceTypeById(id) {
    const type = await ShopServiceTypeModel.findById(id);
    if (!type) { const err = new Error('Shop service type not found.'); err.status = 404; throw err; }
    return type;
  }

  static async createShopServiceType(payload, actorId) {
    const { name, amharicName, afaanOromoName, description } = payload;
    if (!name || !name.trim()) { const err = new Error('Shop service type name is required.'); err.status = 400; throw err; }

    const existing = await ShopServiceTypeModel.findByName(name.trim());
    if (existing) { const err = new Error(`Shop service type "${name.trim()}" already exists.`); err.status = 409; throw err; }

    return ShopServiceTypeModel.create({ 
      name: name.trim(), 
      amharicName: amharicName?.trim() || null, 
      afaanOromoName: afaanOromoName?.trim() || null, 
      description: description?.trim() || null, 
      createdBy: actorId 
    });
  }

  static async updateShopServiceType(id, payload, actorId) {
    await this.getShopServiceTypeById(id);
    const { name, amharicName, afaanOromoName, description } = payload;

    if (name && name.trim()) {
      const existing = await ShopServiceTypeModel.findByName(name.trim(), id);
      if (existing) { const err = new Error(`Shop service type "${name.trim()}" already exists.`); err.status = 409; throw err; }
    }

    const updated = await ShopServiceTypeModel.update(id, {
      name: name ? name.trim() : undefined,
      amharicName: amharicName !== undefined ? (amharicName ? amharicName.trim() : null) : undefined,
      afaanOromoName: afaanOromoName !== undefined ? (afaanOromoName ? afaanOromoName.trim() : null) : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getShopServiceTypeById(id);
  }

  static async toggleShopServiceTypeStatus(id, actorId) {
    const type = await this.getShopServiceTypeById(id);
    const result = await ShopServiceTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Shop service type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteShopServiceType(id, actorId) {
    const type = await this.getShopServiceTypeById(id);
    // Note: You can add a hasShops check here later if you link shops to this table
    await ShopServiceTypeModel.softDelete(id, actorId);
    return { message: `Shop service type "${type.name}" has been deleted successfully.` };
  }
}
module.exports = ShopServiceTypeService;