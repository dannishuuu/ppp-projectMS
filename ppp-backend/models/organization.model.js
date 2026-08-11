// models/organization.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

// ─── Field lists ──────────────────────────────────────────────────────────────

/** Core organization columns returned on every read */
const ORG_FIELDS = `
  o.id,
  o.name,
  o.organization_type_id,
  ot.name                       AS organization_type_name,
  o.phone,
  o.email,
  o.address,
  o.profile_experience,
  o.is_active,
  o.created_at,
  o.updated_at,
  o.created_by,
  o.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

/** Profile columns appended on every read (LEFT JOIN – nullable when no profile yet) */
const PROFILE_FIELDS = `
  op.id                         AS profile_id,
  op.business_sector,
  op.years_of_experience,
  op.registration_date,
  op.license_number,
  op.bio,
  op.past_projects_summary
`;

const BASE_JOIN = `
  FROM organizations o
  LEFT JOIN organization_types ot      ON ot.id  = o.organization_type_id
  LEFT JOIN organization_profiles op   ON op.organization_id = o.id
  LEFT JOIN users creator              ON creator.id = o.created_by
  LEFT JOIN users updater              ON updater.id = o.updated_by
`;

// ─── READ ─────────────────────────────────────────────────────────────────────

class OrganizationModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all', typeId = null } = options;

    let where = `WHERE o.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND (o.name ILIKE :search OR o.email ILIKE :search OR o.phone ILIKE :search)`;
      replacements.search = `%${search}%`;
    }
    if (status !== 'all') {
      where += ` AND o.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }
    if (typeId) {
      where += ` AND o.organization_type_id = :typeId`;
      replacements.typeId = typeId;
    }

    const countQuery = `SELECT COUNT(*) AS total FROM organizations o ${where}`;
    const countResult = await db.query(countQuery, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const query = `
      SELECT ${ORG_FIELDS}, ${PROFILE_FIELDS}
      ${BASE_JOIN}
      ${where}
      ORDER BY o.created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT ${ORG_FIELDS}, ${PROFILE_FIELDS}
      ${BASE_JOIN}
      WHERE o.id = :id AND o.is_deleted = FALSE
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name FROM organizations
      WHERE LOWER(name) = LOWER(:name) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, { replacements: { name }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  // ─── CREATE (both tables, called inside a transaction) ───────────────────

  /**
   * Insert a row into `organizations`.
   * Returns the new org id.
   */
  static async insertOrganization(t, { name, organizationTypeId, phone, email, address, profileExperience, createdBy }) {
    const query = `
      INSERT INTO organizations
        (name, organization_type_id, phone, email, address, profile_experience, created_by, updated_by)
      VALUES
        (:name, :organizationTypeId, :phone, :email, :address, :profileExperience, :createdBy, :createdBy)
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements: {
        name,
        organizationTypeId,
        phone: phone || null,
        email: email || null,
        address: address || null,
        profileExperience: profileExperience || null,
        createdBy,
      },
      type: QueryTypes.SELECT,
      transaction: t,
    });
    return rows[0].id;
  }

  /**
   * Insert a row into `organization_profiles`.
   */
  static async insertProfile(t, { organizationId, businessSector, yearsOfExperience, registrationDate, licenseNumber, bio, pastProjectsSummary, createdBy }) {
    const query = `
      INSERT INTO organization_profiles
        (organization_id, business_sector, years_of_experience, registration_date, license_number, bio, past_projects_summary, created_by, updated_by)
      VALUES
        (:organizationId, :businessSector, :yearsOfExperience, :registrationDate, :licenseNumber, :bio, :pastProjectsSummary, :createdBy, :createdBy)
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements: {
        organizationId,
        businessSector: businessSector || null,
        yearsOfExperience: yearsOfExperience ?? null,
        registrationDate: registrationDate || null,
        licenseNumber: licenseNumber || null,
        bio: bio || null,
        pastProjectsSummary: pastProjectsSummary || null,
        createdBy,
      },
      type: QueryTypes.SELECT,
      transaction: t,
    });
    return rows[0].id;
  }

  // ─── UPDATE (both tables, called inside a transaction) ───────────────────

  static async updateOrganization(t, id, fields, updatedBy) {
    const allowed = ['name', 'organization_type_id', 'phone', 'email', 'address', 'profile_experience'];
    const setClauses = [];
    const replacements = { id, updatedBy };

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        setClauses.push(`${key} = :${key}`);
        replacements[key] = value;
      }
    }
    if (setClauses.length === 0) return;

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');
    const query = `UPDATE organizations SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = FALSE`;
    await db.query(query, { replacements, transaction: t });
  }

  static async updateProfile(t, organizationId, fields, updatedBy) {
    const allowed = ['business_sector', 'years_of_experience', 'registration_date', 'license_number', 'bio', 'past_projects_summary'];
    const setClauses = [];
    const replacements = { organizationId, updatedBy };

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        setClauses.push(`${key} = :${key}`);
        replacements[key] = value;
      }
    }
    if (setClauses.length === 0) return;

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');
    const query = `UPDATE organization_profiles SET ${setClauses.join(', ')} WHERE organization_id = :organizationId AND is_deleted = FALSE`;
    await db.query(query, { replacements, transaction: t });
  }

  // ─── TOGGLE STATUS ────────────────────────────────────────────────────────

  static async toggleStatus(id, updatedBy) {
    const query = `
      UPDATE organizations
      SET is_active  = NOT is_active,
          updated_at = NOW(),
          updated_by = :updatedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, is_active
    `;
    const rows = await db.query(query, { replacements: { id, updatedBy }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  // ─── SOFT DELETE (both tables) ────────────────────────────────────────────

  static async softDelete(t, id, deletedBy) {
    await db.query(
      `UPDATE organizations
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE id = :id`,
      { replacements: { id, deletedBy }, transaction: t }
    );
    await db.query(
      `UPDATE organization_profiles
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE organization_id = :id`,
      { replacements: { id, deletedBy }, transaction: t }
    );
  }
}

module.exports = OrganizationModel;
