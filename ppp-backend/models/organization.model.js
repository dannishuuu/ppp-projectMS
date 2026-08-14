// models/organization.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

// ─── Field lists ──────────────────────────────────────────────────────────────

/** Core organization columns returned on every read */
const ORG_FIELDS = `
  o.id,
  o.name,
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
  updater.first_name || ' ' || updater.last_name AS updated_by_name,
  (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', ot.id,
          'name', ot.name
        ) ORDER BY ot.name
      ) FILTER (WHERE ot.id IS NOT NULL), '[]'::json
    )
    FROM organization_organization_types oot
    JOIN organization_types ot ON ot.id = oot.organization_type_id AND ot.is_deleted = FALSE
    WHERE oot.organization_id = o.id AND oot.is_deleted = FALSE
  ) AS organization_types,
  (
    SELECT string_agg(ot.name, ', ' ORDER BY ot.name)
    FROM organization_organization_types oot
    JOIN organization_types ot ON ot.id = oot.organization_type_id AND ot.is_deleted = FALSE
    WHERE oot.organization_id = o.id AND oot.is_deleted = FALSE
  ) AS organization_type_name,
  (
    SELECT COALESCE(array_agg(oot.organization_type_id::text), ARRAY[]::text[])
    FROM organization_organization_types oot
    WHERE oot.organization_id = o.id AND oot.is_deleted = FALSE
  ) AS organization_type_ids
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
      where += ` AND EXISTS (
        SELECT 1 FROM organization_organization_types oot
        WHERE oot.organization_id = o.id
          AND oot.organization_type_id = :typeId
          AND oot.is_deleted = FALSE
      )`;
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

  // ─── CREATE (called inside a transaction) ───────────────────

  /**
   * Insert a row into `organizations`.
   * Returns the new org id.
   */
  static async insertOrganization(t, { name, phone, email, address, profileExperience, createdBy }) {
    const query = `
      INSERT INTO organizations
        (name, phone, email, address, profile_experience, created_by, updated_by)
      VALUES
        (:name, :phone, :email, :address, :profileExperience, :createdBy, :createdBy)
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements: {
        name,
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
   * Insert rows into `organization_organization_types`.
   */
  static async insertOrganizationTypes(t, { organizationId, organizationTypeIds = [], createdBy }) {
    if (!organizationTypeIds || organizationTypeIds.length === 0) return;

    for (const typeId of organizationTypeIds) {
      const query = `
        INSERT INTO organization_organization_types
          (organization_id, organization_type_id, created_by, updated_by)
        VALUES
          (:organizationId, :typeId, :createdBy, :createdBy)
        ON CONFLICT (organization_id, organization_type_id)
        DO UPDATE SET
          is_deleted = false,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by,
          deleted_at = NULL,
          deleted_by = NULL
      `;
      await db.query(query, {
        replacements: { organizationId, typeId, createdBy },
        transaction: t,
      });
    }
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

  // ─── UPDATE (called inside a transaction) ───────────────────

  static async updateOrganization(t, id, fields, updatedBy) {
    const allowed = ['name', 'phone', 'email', 'address', 'profile_experience'];
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

  static async updateOrganizationTypes(t, organizationId, organizationTypeIds, updatedBy) {
    if (!Array.isArray(organizationTypeIds)) return;

    // 1. Soft delete any types not in the provided organizationTypeIds list
    if (organizationTypeIds.length === 0) {
      await db.query(
        `UPDATE organization_organization_types
         SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :updatedBy
         WHERE organization_id = :organizationId AND is_deleted = FALSE`,
        { replacements: { organizationId, updatedBy }, transaction: t }
      );
    } else {
      await db.query(
        `UPDATE organization_organization_types
         SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :updatedBy
         WHERE organization_id = :organizationId AND is_deleted = FALSE AND organization_type_id NOT IN (:organizationTypeIds)`,
        { replacements: { organizationId, organizationTypeIds, updatedBy }, transaction: t }
      );

      // 2. Insert or reactivate types
      for (const typeId of organizationTypeIds) {
        const query = `
          INSERT INTO organization_organization_types
            (organization_id, organization_type_id, created_by, updated_by)
          VALUES
            (:organizationId, :typeId, :updatedBy, :updatedBy)
          ON CONFLICT (organization_id, organization_type_id)
          DO UPDATE SET
            is_deleted = false,
            updated_at = NOW(),
            updated_by = EXCLUDED.updated_by,
            deleted_at = NULL,
            deleted_by = NULL
        `;
        await db.query(query, {
          replacements: { organizationId, typeId, updatedBy },
          transaction: t,
        });
      }
    }
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

  // ─── SOFT DELETE (all related tables) ────────────────────────────────────

  static async softDelete(t, id, deletedBy) {
    await db.query(
      `UPDATE organizations
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE id = :id`,
      { replacements: { id, deletedBy }, transaction: t }
    );
    await db.query(
      `UPDATE organization_organization_types
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE organization_id = :id AND is_deleted = FALSE`,
      { replacements: { id, deletedBy }, transaction: t }
    );
    await db.query(
      `UPDATE organization_profiles
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE organization_id = :id AND is_deleted = FALSE`,
      { replacements: { id, deletedBy }, transaction: t }
    );
  }
}

module.exports = OrganizationModel;
