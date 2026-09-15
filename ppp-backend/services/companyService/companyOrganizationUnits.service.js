// services/companyService/companyOrganizationUnits.service.js
const CompanyOrganizationUnitModel = require('../../models/companyOrganizationUnit.model');
const CompanyModel = require('../../models/company.model');
const OrgUnitTypeModel = require('../../models/orgUnitType.model');

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/;
const ROOT_TYPE_CODE = 'COMP';

const httpError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

class CompanyOrganizationUnitsService {
  // ── Read ──────────────────────────────────────────────────────────────────

  static async getUnits(options = {}) {
    if (!options.companyId) httpError('companyId query parameter is required.', 400);
    const company = await CompanyModel.findById(options.companyId);
    if (!company) httpError('Company not found.', 404);

    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(options.limit, 10) || 500));
    const offset = (page - 1) * limit;
    let isActive = null;
    if (options.status === 'active') isActive = true;
    if (options.status === 'inactive') isActive = false;

    // parentId: 'root' = roots only, an id = direct children, absent = all
    let parentId;
    if (options.parentId === 'root') parentId = null;
    else if (options.parentId) parentId = options.parentId;

    const { rows, total } = await CompanyOrganizationUnitModel.findAll({
      companyId: options.companyId,
      parentId,
      unitTypeId: options.unitTypeId || null,
      level: options.level !== undefined && options.level !== '' ? parseInt(options.level, 10) : null,
      search: options.search || '',
      isActive,
      limit,
      offset,
    });

    return {
      units: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /**
   * Full nested tree for one company (all non-deleted units).
   */
  static async getTreeForCompany(companyId) {
    const company = await CompanyModel.findById(companyId);
    if (!company) httpError('Company not found.', 404);

    const { rows } = await CompanyOrganizationUnitModel.findAll({ companyId, limit: 5000, offset: 0 });

    const byId = new Map(rows.map((r) => [String(r.id), { ...r, children: [] }]));
    const roots = [];
    for (const node of byId.values()) {
      const parent = node.parent_id ? byId.get(String(node.parent_id)) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return { company, roots };
  }

  static async getUnitById(id) {
    const unit = await CompanyOrganizationUnitModel.findById(id);
    if (!unit) httpError('Organization unit not found.', 404);
    return unit;
  }

  static async getUnitPath(id) {
    const unit = await this.getUnitById(id);
    const ancestors = await CompanyOrganizationUnitModel.findAncestors(id);
    return { unit, breadcrumb: [...ancestors, unit] };
  }

  static async getDescendants(id) {
    const unit = await this.getUnitById(id);
    const descendants = await CompanyOrganizationUnitModel.findDescendants(id);
    return { unit, descendants, total: descendants.length };
  }

  // ── Shared validation helpers ─────────────────────────────────────────────

  static async resolveCompany(companyId) {
    const company = await CompanyModel.findById(companyId);
    if (!company) httpError('Company not found.', 404);
    return company;
  }

  static async resolveUnitType(unitTypeId) {
    const type = await OrgUnitTypeModel.findById(unitTypeId);
    if (!type) httpError('Organization unit type not found.', 404);
    if (!type.is_active) httpError(`Organization unit type "${type.name}" is inactive.`, 400);
    return type;
  }

  static async resolveParent(companyId, parentId) {
    if (!parentId) return null;
    const parent = await CompanyOrganizationUnitModel.findById(parentId);
    if (!parent) httpError('Parent organization unit not found.', 404);
    if (String(parent.company_id) !== String(companyId)) {
      httpError('Parent organization unit belongs to a different company.', 400);
    }
    return parent;
  }

  /**
   * Type ordering rule: a unit's type sort_order must sit strictly below its
   * parent's and strictly above each direct child's, so the tree never nests
   * e.g. a Department above a Division.
   */
  static async assertTypeOrdering({ type, parent, id }) {
    if (parent) {
      const parentType = await OrgUnitTypeModel.findById(parent.unit_type_id);
      if (parentType && type.sort_order <= parentType.sort_order) {
        httpError(
          `"${type.name}" cannot be placed under "${parentType.name}": a child unit type must rank below its parent type.`,
          400
        );
      }
    } else if (type.code !== ROOT_TYPE_CODE) {
      httpError(
        `Only a "${ROOT_TYPE_CODE}" (Company) unit may be a root of the organization tree. Select a parent unit instead.`,
        400
      );
    }

    if (id) {
      const { rows: children } = await CompanyOrganizationUnitModel.findAll({
        companyId: undefined,
        parentId: id,
        limit: 500,
      });
      for (const child of children) {
        const childType = await OrgUnitTypeModel.findById(child.unit_type_id);
        if (childType && type.sort_order >= childType.sort_order) {
          httpError(
            `"${type.name}" cannot be applied: child unit "${child.name}" uses a lower-ranking type ("${childType.name}").`,
            400
          );
        }
      }
    }
  }

  static async assertRootIsUnique(companyId, excludeUnitId = null) {
    const { rows: existingRoots } = await CompanyOrganizationUnitModel.findAll({
      companyId,
      parentId: null,
      limit: 10,
    });
    const others = existingRoots.filter((r) => String(r.id) !== String(excludeUnitId));
    if (others.length > 0) {
      httpError(
        `This company already has a root unit ("${others[0].name}"). Attach the new unit under it via parent_id.`,
        409
      );
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  static async createUnit(payload, actorId) {
    const { companyId, parentId, unitTypeId, code, name } = payload;

    if (!companyId) httpError('companyId is required.', 400);
    if (!unitTypeId) httpError('unitTypeId is required.', 400);
    if (!name || !String(name).trim()) httpError('Unit name is required.', 400);

    const cleanCode = String(code || '').trim();
    if (!cleanCode) httpError('Unit code is required.', 400);
    if (!CODE_RE.test(cleanCode)) {
      httpError('Unit code must be 1-50 characters: letters, digits, "-" or "_" (starting with a letter or digit).', 400);
    }

    const company = await this.resolveCompany(companyId);
    const type = await this.resolveUnitType(unitTypeId);
    const parent = await this.resolveParent(companyId, parentId);

    if (!parent) await this.assertRootIsUnique(companyId);
    await this.assertTypeOrdering({ type, parent });

    const duplicate = await CompanyOrganizationUnitModel.findByCode(companyId, cleanCode);
    if (duplicate) {
      httpError(`Unit code "${cleanCode}" already exists in company "${company.name}".`, 409);
    }

    let sortOrder = 0;
    if (payload.sortOrder !== undefined) {
      const n = parseInt(payload.sortOrder, 10);
      if (isNaN(n) || n < 0) httpError('sort_order must be a non-negative integer.', 400);
      sortOrder = n;
    }

    const id = await CompanyOrganizationUnitModel.create({
      companyId,
      parentId: parent ? parent.id : null,
      unitTypeId,
      code: cleanCode,
      name: String(name).trim(),
      nameAmharic: String(payload.nameAmharic || '').trim() || null,
      nameAfaanOromo: String(payload.nameAfaanOromo || '').trim() || null,
      description: String(payload.description || '').trim() || null,
      sortOrder,
      managerUserId: payload.managerUserId || null,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      createdBy: actorId,
    });

    return this.getUnitById(id);
  }

  static async updateUnit(id, payload, actorId) {
    const unit = await this.getUnitById(id);
    const clean = {};

    if (payload.code !== undefined) {
      const code = String(payload.code).trim();
      if (!code) httpError('Unit code cannot be empty.', 400);
      if (!CODE_RE.test(code)) {
        httpError('Unit code must be 1-50 characters: letters, digits, "-" or "_" (starting with a letter or digit).', 400);
      }
      const duplicate = await CompanyOrganizationUnitModel.findByCode(unit.company_id, code, id);
      if (duplicate) httpError(`Unit code "${code}" already exists in this company.`, 409);
      clean.code = code;
    }

    if (payload.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name) httpError('Unit name cannot be empty.', 400);
      clean.name = name;
    }

    for (const key of ['nameAmharic', 'nameAfaanOromo', 'description']) {
      if (payload[key] !== undefined) clean[key] = String(payload[key] || '').trim() || null;
    }

    if (payload.sortOrder !== undefined) {
      const n = parseInt(payload.sortOrder, 10);
      if (isNaN(n) || n < 0) httpError('sort_order must be a non-negative integer.', 400);
      clean.sortOrder = n;
    }

    if (payload.managerUserId !== undefined) {
      clean.managerUserId = payload.managerUserId || null;
    }

    if (payload.unitTypeId !== undefined && String(payload.unitTypeId) !== String(unit.unit_type_id)) {
      const type = await this.resolveUnitType(payload.unitTypeId);
      const parent = unit.parent_id
        ? await CompanyOrganizationUnitModel.findById(unit.parent_id)
        : null;
      await this.assertTypeOrdering({ type, parent, id });
      clean.unitTypeId = payload.unitTypeId;
    }

    if (payload.isActive !== undefined) clean.isActive = Boolean(payload.isActive);

    const updated = await CompanyOrganizationUnitModel.update(id, { ...clean, updatedBy: actorId });
    if (!updated) httpError('No changes were applied.', 400);
    return this.getUnitById(id);
  }

  /**
   * Re-parent a unit (move within the same company only).
   */
  static async moveUnit(id, payload, actorId) {
    const unit = await this.getUnitById(id);
    const newParentId = payload.parentId === undefined ? null : payload.parentId;

    if (newParentId && String(newParentId) === String(id)) {
      httpError('A unit cannot be moved under itself.', 400);
    }

    const newParent = await this.resolveParent(unit.company_id, newParentId);

    // Cycle guard: new parent must not live inside the subtree being moved
    if (newParent && newParent.path.startsWith(unit.path)) {
      httpError(
        `Cannot move "${unit.name}" under "${newParent.name}": the target parent is a descendant of this unit (would create a cycle).`,
        400
      );
    }

    const type = await OrgUnitTypeModel.findById(unit.unit_type_id);
    await this.assertTypeOrdering({ type, parent: newParent, id });

    if (!newParent) await this.assertRootIsUnique(unit.company_id, id);

    await CompanyOrganizationUnitModel.move(
      id,
      newParent ? { id: newParent.id, path: newParent.path, level: newParent.level } : null,
      { id: unit.id, path: unit.path, level: unit.level },
      actorId
    );

    return this.getUnitById(id);
  }

  static async toggleUnitStatus(id, actorId) {
    const unit = await this.getUnitById(id);
    const result = await CompanyOrganizationUnitModel.update(id, {
      isActive: !unit.is_active,
      updatedBy: actorId,
    });
    if (!result) httpError('Failed to toggle status.', 500);
    return {
      message: `Organization unit "${unit.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  static async deleteUnit(id, actorId) {
    const unit = await this.getUnitById(id);
    const hasChildren = await CompanyOrganizationUnitModel.hasChildren(id);
    if (hasChildren) {
      httpError(
        `Cannot delete "${unit.name}" because it still has child units. Move or delete them first.`,
        409
      );
    }
    await CompanyOrganizationUnitModel.softDelete(id, actorId);
    return { message: `Organization unit "${unit.name}" has been deleted successfully.` };
  }
}

module.exports = CompanyOrganizationUnitsService;
