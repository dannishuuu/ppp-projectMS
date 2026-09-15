// services/companyService/company.service.js
const CompanyModel = require('../../models/company.model');

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

const httpError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

const normalizeCode = (raw) =>
  String(raw || '').trim().toUpperCase().replace(/\s+/g, '');

class CompanyService {
  static async getCompanies(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(options.limit, 10) || 10));
    const offset = (page - 1) * limit;
    let isActive = null;
    if (options.status === 'active') isActive = true;
    if (options.status === 'inactive') isActive = false;

    const { rows, total } = await CompanyModel.findAll({
      limit,
      offset,
      search: options.search || '',
      isActive,
      sortBy: options.sortBy || 'name',
      sortOrder: options.sortOrder || 'ASC',
    });

    return {
      companies: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getCompanyById(id) {
    const company = await CompanyModel.findById(id);
    if (!company) httpError('Company not found.', 404);
    return company;
  }

  static validateBaseFields(payload, { requireCode = true } = {}) {
    const out = {};

    if (requireCode || payload.code !== undefined) {
      const code = normalizeCode(payload.code);
      if (!code) httpError('Company code is required.', 400);
      if (!CODE_RE.test(code)) {
        httpError('Company code must be 2-30 characters: letters, digits, "-" or "_" (starting with a letter or digit).', 400);
      }
      out.code = code;
    }

    if (payload.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name) httpError('Company name is required.', 400);
      out.name = name;
    }

    if (payload.email !== undefined) {
      const email = String(payload.email || '').trim();
      if (email && !EMAIL_RE.test(email)) httpError('Invalid email format.', 400);
      out.email = email || null;
    }

    if (payload.tin !== undefined) {
      const tin = String(payload.tin || '').trim();
      out.tin = tin || null;
    }

    if (payload.registrationDate !== undefined) {
      const date = String(payload.registrationDate || '').trim();
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        httpError('Registration date must be in YYYY-MM-DD format.', 400);
      }
      out.registrationDate = date || null;
    }

    for (const key of ['nameAmharic', 'nameAfaanOromo', 'registrationNumber', 'phone', 'website', 'address', 'logoUrl', 'description']) {
      if (payload[key] !== undefined) {
        out[key] = String(payload[key] || '').trim() || null;
      }
    }

    if (payload.isActive !== undefined) out.isActive = Boolean(payload.isActive);

    return out;
  }

  static async createCompany(payload, actorId) {
    const clean = this.validateBaseFields(payload, { requireCode: true });
    if (!clean.name) httpError('Company name is required.', 400);

    const existingCode = await CompanyModel.findByCode(clean.code);
    if (existingCode) httpError(`A company with code "${clean.code}" already exists.`, 409);

    if (clean.tin) {
      const existingTin = await CompanyModel.findByTin(clean.tin);
      if (existingTin) {
        httpError(`A company with TIN "${clean.tin}" already exists (${existingTin.name}).`, 409);
      }
    }

    return CompanyModel.create({ ...clean, createdBy: actorId });
  }

  static async updateCompany(id, payload, actorId) {
    await this.getCompanyById(id);
    const clean = this.validateBaseFields(payload);

    if (clean.code) {
      const existingCode = await CompanyModel.findByCode(clean.code, id);
      if (existingCode) httpError(`A company with code "${clean.code}" already exists.`, 409);
    }

    if (clean.tin) {
      const existingTin = await CompanyModel.findByTin(clean.tin, id);
      if (existingTin) {
        httpError(`A company with TIN "${clean.tin}" already exists (${existingTin.name}).`, 409);
      }
    }

    if (clean.name === '') httpError('Company name cannot be empty.', 400);

    const updated = await CompanyModel.update(id, { ...clean, updatedBy: actorId });
    if (!updated) httpError('No changes were applied.', 400);
    return this.getCompanyById(id);
  }

  static async toggleCompanyStatus(id, actorId) {
    const company = await this.getCompanyById(id);
    const result = await CompanyModel.update(id, { isActive: !company.is_active, updatedBy: actorId });
    if (!result) httpError('Failed to toggle status.', 500);
    return {
      message: `Company "${company.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  static async deleteCompany(id, actorId) {
    const company = await this.getCompanyById(id);
    const hasUnits = await CompanyModel.hasOrgUnits(id);
    if (hasUnits) {
      httpError(
        `Cannot delete company "${company.name}" because it still has organization units. Delete or reassign them first.`,
        409
      );
    }
    await CompanyModel.softDelete(id, actorId);
    return { message: `Company "${company.name}" has been deleted successfully.` };
  }
}

module.exports = CompanyService;
