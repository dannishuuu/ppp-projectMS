// services/organizationService/organization.service.js
const db = require('../../config/database');
const OrganizationModel = require('../../models/organization.model');

class OrganizationService {
  // ─── LIST ─────────────────────────────────────────────────────────────────

  /**
   * Paginated, filtered list of organizations (includes profile data and organization types).
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
   * Get a single organization + its profile and organization types by UUID.
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
   * Create an organization AND its profile and type mappings in a single atomic transaction.
   *
   * Expected payload shape:
   * {
   *   // organizations table fields
   *   name, organizationTypeIds?, organizationTypeId?, phone?, email?,
   *   countryId, regionId, zoneId?, woredaId?, profileExperience?,
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
      amharicOrgName,
      oromoOrgName,
      organizationTypeIds,
      organizationTypeId,
      phone,
      email,
      countryId,
      regionId,
      zoneId,
      woredaId,
      profileExperience,
      // profile fields
      businessSectorId,
      yearsOfExperience,
      registrationDate,
      licenseNumber,
      bio,
      pastProjectsSummary,
    } = payload;

    // Normalize type IDs into an array
    let typeIds = [];
    if (Array.isArray(organizationTypeIds)) {
      typeIds = organizationTypeIds.filter(Boolean);
    } else if (organizationTypeIds) {
      typeIds = [organizationTypeIds];
    } else if (organizationTypeId) {
      typeIds = [organizationTypeId];
    }

    // ── Validation (All fields mandatory except Experience & Track Record) ──
    if (!name || !name.trim()) {
      const err = new Error('Organization name is required.');
      err.status = 400;
      throw err;
    }
    if (!amharicOrgName || !amharicOrgName.trim()) {
      const err = new Error('Organization name (Amharic) is required.');
      err.status = 400;
      throw err;
    }
    if (!oromoOrgName || !oromoOrgName.trim()) {
      const err = new Error('Organization name (Oromo) is required.');
      err.status = 400;
      throw err;
    }
    if (typeIds.length === 0) {
      const err = new Error('At least one Organization Type is required.');
      err.status = 400;
      throw err;
    }
    if (!phone || !phone.trim()) {
      const err = new Error('Phone number is required.');
      err.status = 400;
      throw err;
    }
    if (!email || !email.trim()) {
      const err = new Error('Email address is required.');
      err.status = 400;
      throw err;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const err = new Error('Please enter a valid email address.');
      err.status = 400;
      throw err;
    }
    if (!countryId) {
      const err = new Error('Country is required.');
      err.status = 400;
      throw err;
    }
    if (!regionId) {
      const err = new Error('Region is required.');
      err.status = 400;
      throw err;
    }
    if (!businessSectorId) {
      const err = new Error('Business sector is required.');
      err.status = 400;
      throw err;
    }
    if (!registrationDate) {
      const err = new Error('Legal registration date is required.');
      err.status = 400;
      throw err;
    }
    if (!licenseNumber || !licenseNumber.trim()) {
      const err = new Error('Trade license / registration number is required.');
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
        amharicOrgName: amharicOrgName.trim(),
        oromoOrgName: oromoOrgName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        countryId,
        regionId,
        zoneId: zoneId || null,
        woredaId: woredaId || null,
        profileExperience: profileExperience ? profileExperience.trim() : null,
        createdBy: actorId,
      });

      await OrganizationModel.insertOrganizationTypes(t, {
        organizationId: orgId,
        organizationTypeIds: typeIds,
        createdBy: actorId,
      });

      await OrganizationModel.insertProfile(t, {
        organizationId: orgId,
        businessSectorId,
        yearsOfExperience: yearsOfExperience !== undefined && yearsOfExperience !== '' && yearsOfExperience !== null ? parseInt(yearsOfExperience, 10) : null,
        registrationDate,
        licenseNumber: licenseNumber.trim(),
        bio: bio ? bio.trim() : null,
        pastProjectsSummary: pastProjectsSummary ? pastProjectsSummary.trim() : null,
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
   * Full atomic update of an organization and its associated types & profile.
   * @param {string} id - Organization UUID
   * @param {object} payload - Updated organization data
   * @param {string} actorId - User ID making the update
   */
  static async updateOrganization(id, payload, actorId) {
    const org = await this.getOrganizationById(id);
    const {
      name,
      amharicOrgName,
      oromoOrgName,
      organizationTypeIds,
      organizationTypeId,
      phone,
      email,
      countryId,
      regionId,
      zoneId,
      woredaId,
      profileExperience,
      // profile fields
      businessSectorId,
      yearsOfExperience,
      registrationDate,
      licenseNumber,
      bio,
      pastProjectsSummary,
    } = payload;

    // Normalize type IDs if present in payload
    let typeIds = undefined;
    if (Array.isArray(organizationTypeIds)) {
      typeIds = organizationTypeIds.filter(Boolean);
    } else if (organizationTypeIds !== undefined) {
      typeIds = organizationTypeIds ? [organizationTypeIds] : [];
    } else if (organizationTypeId !== undefined) {
      typeIds = organizationTypeId ? [organizationTypeId] : [];
    }

    // ── Validation (All fields mandatory except Experience & Track Record) ──
    if (!name || !name.trim()) {
      const err = new Error('Organization name is required.');
      err.status = 400;
      throw err;
    }
    if (!amharicOrgName || !amharicOrgName.trim()) {
      const err = new Error('Organization name (Amharic) is required.');
      err.status = 400;
      throw err;
    }
    if (!oromoOrgName || !oromoOrgName.trim()) {
      const err = new Error('Organization name (Oromo) is required.');
      err.status = 400;
      throw err;
    }
    if (typeIds !== undefined && typeIds.length === 0) {
      const err = new Error('At least one Organization Type is required.');
      err.status = 400;
      throw err;
    }
    if (!phone || !phone.trim()) {
      const err = new Error('Phone number is required.');
      err.status = 400;
      throw err;
    }
    if (!email || !email.trim()) {
      const err = new Error('Email address is required.');
      err.status = 400;
      throw err;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const err = new Error('Please enter a valid email address.');
      err.status = 400;
      throw err;
    }
    if (!countryId) {
      const err = new Error('Country is required.');
      err.status = 400;
      throw err;
    }
    if (!regionId) {
      const err = new Error('Region is required.');
      err.status = 400;
      throw err;
    }
    if (!businessSectorId) {
      const err = new Error('Business sector is required.');
      err.status = 400;
      throw err;
    }
    if (!registrationDate) {
      const err = new Error('Legal registration date is required.');
      err.status = 400;
      throw err;
    }
    if (!licenseNumber || !licenseNumber.trim()) {
      const err = new Error('Trade license / registration number is required.');
      err.status = 400;
      throw err;
    }

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
        name: name.trim(),
        amharic_org_name: amharicOrgName.trim(),
        oromo_org_name: oromoOrgName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        country_id: countryId || null,
        region_id: regionId || null,
        zone_id: zoneId || null,
        woreda_id: woredaId || null,
        profile_experience: profileExperience ? profileExperience.trim() : null,
      }, actorId);

      if (typeIds !== undefined) {
        await OrganizationModel.updateOrganizationTypes(t, id, typeIds, actorId);
      }

      await OrganizationModel.updateProfile(t, id, {
        business_sector_id: businessSectorId,
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
   * Soft-delete the organization, its profiles, and type mappings atomically.
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
