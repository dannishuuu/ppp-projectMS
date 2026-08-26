const PaymentTimingModel = require('../../models/paymentTiming.model');

class PaymentTimingService {
  static async getPaymentTimings(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await PaymentTimingModel.findAll({ limit, offset, search, isActive });
    return { paymentTimings: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getPaymentTimingById(id) {
    const timing = await PaymentTimingModel.findById(id);
    if (!timing) { const err = new Error('Payment timing not found.'); err.status = 404; throw err; }
    return timing;
  }

  static async createPaymentTiming(payload, actorId) {
    const { name, timingCode, timing_code, nameAmharic, description } = payload;
    if (!name || !name.trim()) { const err = new Error('Payment timing name is required.'); err.status = 400; throw err; }

    const code = (timingCode || timing_code) ? (timingCode || timing_code).trim().toUpperCase().replace(/\s+/g, '') : null;

    const existingName = await PaymentTimingModel.findByName(name.trim());
    if (existingName) { const err = new Error(`Payment timing "${name.trim()}" already exists.`); err.status = 409; throw err; }

    if (code) {
      const existingCode = await PaymentTimingModel.findByCode(code);
      if (existingCode) { const err = new Error(`Payment timing with code "${code}" already exists.`); err.status = 409; throw err; }
    }

    const created = await PaymentTimingModel.create({ 
      name: name.trim(), 
      timingCode: code,
      nameAmharic: nameAmharic?.trim() || null, 
      description: description?.trim() || null, 
      createdBy: actorId 
    });

    return this.getPaymentTimingById(created.id);
  }

  static async updatePaymentTiming(id, payload, actorId) {
    await this.getPaymentTimingById(id);
    const { name, timingCode, timing_code, nameAmharic, description } = payload;
    const code = timingCode !== undefined ? (timingCode ? timingCode.trim() : null) : (timing_code !== undefined ? (timing_code ? timing_code.trim() : null) : undefined);

    if (name && name.trim()) {
      const existing = await PaymentTimingModel.findByName(name.trim(), id);
      if (existing) { const err = new Error(`Payment timing "${name.trim()}" already exists.`); err.status = 409; throw err; }
    }

    if (code) {
      const existingCode = await PaymentTimingModel.findByCode(code, id);
      if (existingCode) { const err = new Error(`Payment timing with code "${code}" already exists.`); err.status = 409; throw err; }
    }

    const updated = await PaymentTimingModel.update(id, {
      name: name ? name.trim() : undefined,
      timingCode: code,
      nameAmharic: nameAmharic !== undefined ? (nameAmharic ? nameAmharic.trim() : null) : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
    return this.getPaymentTimingById(id);
  }

  static async togglePaymentTimingStatus(id, actorId) {
    const timing = await this.getPaymentTimingById(id);
    const result = await PaymentTimingModel.update(id, { isActive: !timing.is_active, updatedBy: actorId });
    if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
    return { message: `Payment timing "${timing.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
  }

  static async deletePaymentTiming(id, actorId) {
    const timing = await this.getPaymentTimingById(id);
    await PaymentTimingModel.softDelete(id, actorId);
    return { message: `Payment timing "${timing.name}" has been deleted successfully.` };
  }
}
module.exports = PaymentTimingService;