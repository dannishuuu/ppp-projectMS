const RentalPaymentTypeModel = require('../../models/rentalPaymentType.model');

class RentalPaymentTypeService {
  static async getRentalPaymentTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await RentalPaymentTypeModel.findAll({ limit, offset, search, isActive });
    return { rentalPaymentTypes: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getRentalPaymentTypeById(id) {
    const type = await RentalPaymentTypeModel.findById(id);
    if (!type) { const err = new Error('Rental payment type not found.'); err.status = 404; throw err; }
    return type;
  }

  static async createRentalPaymentType(payload, actorId) {
    const { name, nameAmharic, durationDays, description } = payload;
    if (!name || !name.trim()) { const err = new Error('Payment type name is required.'); err.status = 400; throw err; }
    if (!durationDays || durationDays <= 0) { const err = new Error('Duration days must be greater than 0.'); err.status = 400; throw err; }

    const existing = await RentalPaymentTypeModel.findByName(name.trim());
    if (existing) { const err = new Error(`Rental payment type "${name.trim()}" already exists.`); err.status = 409; throw err; }

    return RentalPaymentTypeModel.create({ 
      name: name.trim(), 
      nameAmharic: nameAmharic?.trim() || null, 
      durationDays: parseInt(durationDays, 10), 
      description: description?.trim() || null, 
      createdBy: actorId 
    });
  }

  static async updateRentalPaymentType(id, payload, actorId) {
    await this.getRentalPaymentTypeById(id);
    const { name, nameAmharic, durationDays, description } = payload;

    if (name && name.trim()) {
      const existing = await RentalPaymentTypeModel.findByName(name.trim(), id);
      if (existing) { const err = new Error(`Rental payment type "${name.trim()}" already exists.`); err.status = 409; throw err; }
    }
    
    if (durationDays !== undefined && durationDays <= 0) {
      const err = new Error('Duration days must be greater than 0.'); err.status = 400; throw err;
    }

    const updated = await RentalPaymentTypeModel.update(id, {
      name: name ? name.trim() : undefined,
      nameAmharic: nameAmharic !== undefined ? (nameAmharic ? nameAmharic.trim() : null) : undefined,
      durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getRentalPaymentTypeById(id);
  }

  static async toggleRentalPaymentTypeStatus(id, actorId) {
    const type = await this.getRentalPaymentTypeById(id);
    const result = await RentalPaymentTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Rental payment type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deleteRentalPaymentType(id, actorId) {
    const type = await this.getRentalPaymentTypeById(id);
    await RentalPaymentTypeModel.softDelete(id, actorId);
    return { message: `Rental payment type "${type.name}" has been deleted successfully.` };
  }
}
module.exports = RentalPaymentTypeService;