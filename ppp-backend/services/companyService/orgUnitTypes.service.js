// services/companyService/orgUnitTypes.service.js
const OrgUnitTypeModel = require('../../models/orgUnitType.model');

const CODE_RE = /^[A-Z][A-Z0-9_-]{1,19}$/;

const httpError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

class OrgUnitTypeService {
  static async getOrgUnitTypes(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(options.limit, 10) || 50));
    const offset = (page - 1) * limit;
    let isActive = null;
    if (options.status === 'active') isActive = true;
    if (options.status === 'inactive') isActive = false;

    const { rows, total } = await OrgUnitTypeModel.findAll({
      limit,
      offset,
      search: options.search || '',
      isActive,
      sortBy: options.sortBy || 'sort_order',
    });

    return {
      orgUnitTypes: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getOrgUnitTypeById(id) {
    const type = await OrgUnitTypeModel.findById(id);
    if (!type) httpError('Organization unit type not found.', 404);
    return type;
  }

  static validatePayload(payload, { requireCode = true, requireName = true } = {}) {
    const out = {};

    if (requireCode || payload.code !== undefined) {
      const code = String(payload.code || '').trim().toUpperCase();
      if (!code) httpError('Unit type code is required.', 400);
      if (!CODE_RE.test(code)) {
        httpError('Unit type code must be 2-20 characters: start with a letter; letters, digits, "-" or "_".', 400);
      }
      out.code = code;
    }

    if (requireName || payload.name !== undefined) {
      const name = String(payload.name || '').trim();
      if (!name) httpError('Unit type name is required.', 400);
      out.name = name;
    }

    if (payload.sortOrder !== undefined) {
      const n = parseInt(payload.sortOrder, 10);
      if (isNaN(n) || n < 0) httpError('sort_order must be a non-negative integer.', 400);
      out.sortOrder = n;
    }

    for (const key of ['nameAmharic', 'nameAfaanOromo', 'description']) {
      if (payload[key] !== undefined) out[key] = String(payload[key] || '').trim() || null;
    }
    if (payload.isActive !== undefined) out.isActive = Boolean(payload.isActive);

    return out;
  }

  static async createOrgUnitType(payload, actorId) {
    const clean = this.validatePayload(payload);

    const existingCode = await OrgUnitTypeModel.findByCode(clean.code);
    if (existingCode) httpError(`An organization unit type with code "${clean.code}" already exists.`, 409);

    return OrgUnitTypeModel.create({ ...clean, createdBy: actorId });
  }

  static async updateOrgUnitType(id, payload, actorId) {
    await this.getOrgUnitTypeById(id);
    const clean = this.validatePayload(payload, { requireCode: false, requireName: false });

    if (clean.code) {
      const existingCode = await OrgUnitTypeModel.findByCode(clean.code, id);
      if (existingCode) httpError(`An organization unit type with code "${clean.code}" already exists.`, 409);
    }

    const updated = await OrgUnitTypeModel.update(id, { ...clean, updatedBy: actorId });
    if (!updated) httpError('No changes were applied.', 400);
    return this.getOrgUnitTypeById(id);
  }

  static async toggleOrgUnitTypeStatus(id, actorId) {
    const type = await this.getOrgUnitTypeById(id);
    const result = await OrgUnitTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
    if (!result) httpError('Failed to toggle status.', 500);
    return {
      message: `Organization unit type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  static async deleteOrgUnitType(id, actorId) {
    const type = await this.getOrgUnitTypeById(id);
    const inUse = await OrgUnitTypeModel.hasUnits(id);
    if (inUse) {
      httpError(
        `Cannot delete organization unit type "${type.name}" because it is used by existing org units.`,
        409
      );
    }
    await OrgUnitTypeModel.softDelete(id, actorId);
    return { message: `Organization unit type "${type.name}" has been deleted successfully.` };
  }
}

module.exports = OrgUnitTypeService;
