// services/organizationService/organization.service.js
const db = require('../../config/database');
const OrganizationModel = require('../../models/organization.model');
const OrganizationDocumentTypesModel = require('../../models/organizationDocumentTypes.model');

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
    *   licenseNumber?, licenseExpiryDate?, bio?, pastProjectsSummary?
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
      licenseExpiryDate,
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
    if (licenseExpiryDate && registrationDate && new Date(licenseExpiryDate) < new Date(registrationDate)) {
      const err = new Error('License expiry date cannot be earlier than the legal registration date.');
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
        licenseExpiryDate,
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
      licenseExpiryDate,
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
    if (licenseExpiryDate && registrationDate && new Date(licenseExpiryDate) < new Date(registrationDate)) {
      const err = new Error('License expiry date cannot be earlier than the legal registration date.');
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
        license_expiry_date: licenseExpiryDate,
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

  // ─── ORGANIZATION DOCUMENTS ───────────────────────────────────────────────

  /**
   * List all documents attached to an organization.
   * @param {string} organizationId
   * @param {object} options - { documentTypeId?, verified?: 'all'|'verified'|'unverified' }
   */
  static async getOrganizationDocuments(organizationId, options = {}) {
    await this.getOrganizationById(organizationId);
    const rows = await OrganizationModel.findOrganizationDocuments(organizationId, options);
    return { organizationDocuments: rows };
  }

  /**
   * Get a single organization document by UUID.
   * @param {string} documentId
   */
  static async getOrganizationDocumentById(documentId) {
    const doc = await OrganizationModel.findOrganizationDocumentById(documentId);
    if (!doc) {
      const err = new Error('Organization document not found.');
      err.status = 404;
      throw err;
    }
    return doc;
  }

  /**
   * Attach a new document to an organization (metadata for an already-uploaded file).
   * @param {string} organizationId
   * @param {object} payload - { documentTypeId, documentNumber?, title, description?,
   *                            filePath, originalFilename, fileSize?, mimeType?, fileHash?,
   *                            issuedDate?, expiryDate? }
   * @param {string} actorId
   */
  static async addOrganizationDocument(organizationId, payload, actorId) {
    await this.getOrganizationById(organizationId);

    const {
      documentTypeId, documentNumber, title, description,
      filePath, originalFilename, fileSize, mimeType, fileHash,
      issuedDate, expiryDate,
    } = payload;

    if (!title || !title.trim()) {
      const err = new Error('Document title is required.');
      err.status = 400;
      throw err;
    }
    if (!documentTypeId) {
      const err = new Error('Document type is required.');
      err.status = 400;
      throw err;
    }
    if (!filePath || !filePath.trim()) {
      const err = new Error('Uploaded file path is required. Upload the file first, then attach the metadata.');
      err.status = 400;
      throw err;
    }
    if (!originalFilename || !originalFilename.trim()) {
      const err = new Error('Original file name is required.');
      err.status = 400;
      throw err;
    }
    if (!issuedDate) {
      const err = new Error('Issued date is required for all documents.');
      err.status = 400;
      throw err;
    }

    const docType = await OrganizationDocumentTypesModel.findById(documentTypeId);
    if (!docType || docType.is_deleted || docType.is_active === false) {
      const err = new Error('Invalid document type.');
      err.status = 400;
      throw err;
    }
    if (docType.requires_expiry && !expiryDate) {
      const err = new Error(`Document type "${docType.name}" requires an expiry date.`);
      err.status = 400;
      throw err;
    }
    if (issuedDate && expiryDate && new Date(expiryDate) < new Date(issuedDate)) {
      const err = new Error('Expiry date cannot be earlier than the issued date.');
      err.status = 400;
      throw err;
    }

    const t = await db.transaction();
    try {
      const docId = await OrganizationModel.insertOrganizationDocument(t, {
        organizationId,
        documentTypeId,
        documentNumber: documentNumber?.trim() || null,
        title: title.trim(),
        description: description?.trim() || null,
        filePath: filePath.trim(),
        originalFilename: originalFilename.trim(),
        fileSize: fileSize !== undefined && fileSize !== null && fileSize !== '' ? parseInt(fileSize, 10) : null,
        mimeType: mimeType || null,
        fileHash: fileHash || null,
        issuedDate: issuedDate || null,
        expiryDate: expiryDate || null,
        createdBy: actorId,
      });
      await t.commit();
      return this.getOrganizationDocumentById(docId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Update an organization document's metadata (not the file itself).
   * @param {string} documentId
   * @param {object} payload - { documentTypeId?, documentNumber?, title?, description?, issuedDate?, expiryDate? }
   * @param {string} actorId
   */
  static async updateOrganizationDocument(documentId, payload, actorId) {
    const doc = await this.getOrganizationDocumentById(documentId);

    const {
      documentTypeId, documentNumber, title, description,
      issuedDate, expiryDate,
    } = payload;

    if (title !== undefined && !title.trim()) {
      const err = new Error('Document title cannot be empty.');
      err.status = 400;
      throw err;
    }

    const nextTypeId = documentTypeId !== undefined ? documentTypeId : doc.document_type_id;
    const nextIssued = issuedDate !== undefined ? issuedDate : doc.issued_date;
    const nextExpiry = expiryDate !== undefined ? expiryDate : doc.expiry_date;

    if (nextTypeId && nextTypeId !== doc.document_type_id) {
      const docType = await OrganizationDocumentTypesModel.findById(nextTypeId);
      if (!docType || docType.is_deleted || docType.is_active === false) {
        const err = new Error('Invalid document type.');
        err.status = 400;
        throw err;
      }
      if (docType.requires_expiry && !nextExpiry) {
        const err = new Error(`Document type "${docType.name}" requires an expiry date.`);
        err.status = 400;
        throw err;
      }
    }
    if (nextIssued && nextExpiry && new Date(nextExpiry) < new Date(nextIssued)) {
      const err = new Error('Expiry date cannot be earlier than the issued date.');
      err.status = 400;
      throw err;
    }

    const t = await db.transaction();
    try {
      const updated = await OrganizationModel.updateOrganizationDocument(t, documentId, {
        document_type_id: documentTypeId,
        document_number: documentNumber !== undefined ? documentNumber?.trim() : undefined,
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        issued_date: issuedDate,
        expiry_date: expiryDate,
      }, actorId);

      if (!updated) {
        const err = new Error('No changes were applied.');
        err.status = 400;
        throw err;
      }

      await t.commit();
      return this.getOrganizationDocumentById(documentId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Mark an organization document as verified.
   * @param {string} documentId
   * @param {object} payload - { notes? }
   * @param {string} actorId
   */
  static async verifyOrganizationDocument(documentId, payload, actorId) {
    await this.getOrganizationDocumentById(documentId);

    const body = payload || {};
    // is_verified is the status: true = approved, false + verified_at = rejected, untouched = pending
    const status = body.status || (body.is_verified === false ? 'rejected' : 'approved');
    const notes = body.notes ?? body.verification_notes ?? body.verificationNotes ?? null;

    if (status !== 'approved' && status !== 'rejected') {
      const err = new Error('Verification status must be either "approved" or "rejected".');
      err.status = 400;
      throw err;
    }
    if (status === 'rejected' && (!notes || !notes.trim())) {
      const err = new Error('Verification notes are required when rejecting a document.');
      err.status = 400;
      throw err;
    }

    const isVerified = status === 'approved';
    const result = await OrganizationModel.verifyOrganizationDocument(documentId, actorId, isVerified, notes);
    if (!result) {
      const err = new Error('Failed to verify document.');
      err.status = 500;
      throw err;
    }
    return this.getOrganizationDocumentById(documentId);
  }

  /**
   * Soft delete an organization document.
   * @param {string} documentId
   * @param {string} actorId
   */
  static async deleteOrganizationDocument(documentId, actorId) {
    const doc = await this.getOrganizationDocumentById(documentId);

    const t = await db.transaction();
    try {
      await OrganizationModel.softDeleteOrganizationDocument(t, documentId, actorId);
      await t.commit();
      return { message: `Document "${doc.title}" has been deleted successfully.` };
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
