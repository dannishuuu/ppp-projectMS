// services/organizationService/organization.service.js
const db = require('../../config/database');
const OrganizationModel = require('../../models/organization.model');

class OrganizationService {
  // ─── LIST ─────────────────────────────────────────────────────────────────

  /**
   * Paginated, filtered list of organizations (includes profile data).
   * @param {object} options - { page, limit, search, status, typeId }
   */
  static async getOrganizations(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', typeId = null } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await OrganizationModel.findAll({ limit, offset, search, status, typeId });

    return {
      organizations: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  /**
   * Get a single organization + its profile by UUID.
   * @param {string} id
   */
  static async getOrganizationById(id) {
    const org = await OrganizationModel.findById(id);
    if (!org) {
      const err = new Error('Organization not found.');
      err.status = 404;
      throw err;
    }
    return org;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  /**
   * Create an organization AND its profile in a single atomic transaction.
   *
   * Expected payload shape:
   * {
   *   // organizations table fields
   *   name, organizationTypeId, phone?, email?, address?, profileExperience?,
   *
   *   // organization_profiles table fields
   *   businessSector?, yearsOfExperience?, registrationDate?,
   *   licenseNumber?, bio?, pastProjectsSummary?
   * }
   *
   * @param {object} payload
   * @param {string} actorId - ID of the authenticated user
   */
  static async createOrganization(payload, actorId) {
    const {
      name,
      organizationTypeId,
      phone,
      email,
      address,
      profileExperience,
      // profile fields
      businessSector,
      yearsOfExperience,
      registrationDate,
      licenseNumber,
      bio,
      pastProjectsSummary,
    } = payload;

    // ── Validation ────────────────────────────────────────────────────────
    if (!name || !name.trim()) {
      const err = new Error('Organization name is required.');
      err.status = 400;
      throw err;
    }
    if (!organizationTypeId) {
      const err = new Error('Organization type is required.');
      err.status = 400;
      throw err;
    }

    // Uniqueness check
    const existing = await OrganizationModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`An organization named "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    // ── Atomic write ──────────────────────────────────────────────────────
    const t = await db.transaction();
    try {
      const orgId = await OrganizationModel.insertOrganization(t, {
        name: name.trim(),
        organizationTypeId,
        phone,
        email,
        address,
        profileExperience,
        createdBy: actorId,
      });

      await OrganizationModel.insertProfile(t, {
        organizationId: orgId,
        businessSector,
        yearsOfExperience,
        registrationDate,
        licenseNumber,
        bio,
        pastProjectsSummary,
        createdBy: actorId,
      });

      await t.commit();
      return this.getOrganizationById(orgId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  /**
   * Update organization + profile fields in a single atomic transaction.
   * Only fields present in the payload are updated (partial update supported).
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updateOrganization(id, payload, actorId) {
    // Confirm it exists
    await this.getOrganizationById(id);

    const {
      // org fields
      name,
      organizationTypeId,
      phone,
      email,
      address,
      profileExperience,
      // profile fields
      businessSector,
      yearsOfExperience,
      registrationDate,
      licenseNumber,
      bio,
      pastProjectsSummary,
    } = payload;

    // Uniqueness check when renaming
    if (name && name.trim()) {
      const existing = await OrganizationModel.findByName(name.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`An organization named "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const t = await db.transaction();
    try {
      // Map camelCase payload → snake_case column names
      await OrganizationModel.updateOrganization(t, id, {
        name: name ? name.trim() : undefined,
        organization_type_id: organizationTypeId,
        phone,
        email,
        address,
        profile_experience: profileExperience,
      }, actorId);

      await OrganizationModel.updateProfile(t, id, {
        business_sector: businessSector,
        years_of_experience: yearsOfExperience,
        registration_date: registrationDate,
        license_number: licenseNumber,
        bio,
        past_projects_summary: pastProjectsSummary,
      }, actorId);

      await t.commit();
      return this.getOrganizationById(id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── TOGGLE STATUS ────────────────────────────────────────────────────────

  /**
   * Toggle the is_active flag on the organization row.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleOrganizationStatus(id, actorId) {
    const org = await this.getOrganizationById(id);
    const result = await OrganizationModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle organization status.');
      err.status = 500;
      throw err;
    }
    return {
      message: `Organization "${org.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────

  /**
   * Soft-delete both the organization and its profile atomically.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteOrganization(id, actorId) {
    const org = await this.getOrganizationById(id);

    const t = await db.transaction();
    try {
      await OrganizationModel.softDelete(t, id, actorId);
      await t.commit();
      return { message: `Organization "${org.name}" has been deleted successfully.` };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

module.exports = OrganizationService;
