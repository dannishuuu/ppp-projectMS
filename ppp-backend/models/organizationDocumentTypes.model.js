// models/organizationDocumentTypes.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const ORG_DOC_TYPE_FIELDS = `
  odt.id,
  odt.name,
  odt.code,
  odt.description,
  odt.is_required,
  odt.requires_expiry,
  odt.is_active,
  odt.created_at,
  odt.updated_at,
  odt.created_by,
  odt.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class OrganizationDocumentTypesModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all' } = options;

    let where = `WHERE odt.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND (odt.name ILIKE :search OR odt.code ILIKE :search OR odt.description ILIKE :search)`;
      replacements.search = `%${search}%`;
    }

    if (status !== 'all') {
      where += ` AND odt.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM organization_document_types odt
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const query = `
      SELECT ${ORG_DOC_TYPE_FIELDS}
      FROM organization_document_types odt
      LEFT JOIN users creator ON creator.id = odt.created_by
      LEFT JOIN users updater ON updater.id = odt.updated_by
      ${where}
      ORDER BY odt.name ASC
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT ${ORG_DOC_TYPE_FIELDS}
      FROM organization_document_types odt
      LEFT JOIN users creator ON creator.id = odt.created_by
      LEFT JOIN users updater ON updater.id = odt.updated_by
      WHERE odt.id = :id AND odt.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name FROM organization_document_types
      WHERE LOWER(name) = LOWER(:name) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { name },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByCode(code) {
    const query = `
      SELECT id, code FROM organization_document_types
      WHERE UPPER(code) = UPPER(:code) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { code },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async create({ name, code, description, isRequired, requiresExpiry, createdBy }) {
    const query = `
      INSERT INTO organization_document_types
        (name, code, description, is_required, requires_expiry, is_active, created_by, updated_by)
      VALUES
        (:name, :code, :description, :isRequired, :requiresExpiry, TRUE, :createdBy, :createdBy)
      RETURNING id, name, code, description, is_required, requires_expiry, is_active, created_at, updated_at
    `;
    const rows = await db.query(query, {
      replacements: {
        name,
        code,
        description: description || null,
        isRequired: isRequired === true,
        requiresExpiry: requiresExpiry === true,
        createdBy,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, { name, code, description, isRequired, requiresExpiry, updatedBy }) {
    const setClauses = [];
    const replacements = { id, updatedBy };

    if (name !== undefined) {
      setClauses.push('name = :name');
      replacements.name = name;
    }
    if (code !== undefined) {
      setClauses.push('code = :code');
      replacements.code = code;
    }
    if (description !== undefined) {
      setClauses.push('description = :description');
      replacements.description = description || null;
    }
    if (isRequired !== undefined) {
      setClauses.push('is_required = :isRequired');
      replacements.isRequired = isRequired === true;
    }
    if (requiresExpiry !== undefined) {
      setClauses.push('requires_expiry = :requiresExpiry');
      replacements.requiresExpiry = requiresExpiry === true;
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');

    const query = `
      UPDATE organization_document_types
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async toggleStatus(id, updatedBy) {
    const query = `
      UPDATE organization_document_types
      SET is_active = NOT COALESCE(is_active, TRUE),
          updated_at = NOW(),
          updated_by = :updatedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, is_active
    `;
    const rows = await db.query(query, {
      replacements: { id, updatedBy },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE organization_document_types
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :deletedBy
      WHERE id = :id AND is_deleted = FALSE
    `;
    await db.query(query, { replacements: { id, deletedBy } });
  }
}

module.exports = OrganizationDocumentTypesModel;
