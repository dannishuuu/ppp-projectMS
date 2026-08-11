// models/projectProposal.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_PROPOSAL_FIELDS = `
  pp.id,
  pp.organization_id,
  pp.status_id,
  pp.proposed_project_name,
  pp.description,
  pp.land_requested,
  pp.proposed_capital_amount,
  pp.currency_id,
  pp.remarks,
  pp.attached_documents,
  pp.submitted_at,
  pp.converted_project_id,
  pp.is_deleted,
  pp.created_at,
  pp.updated_at,
  pp.created_by,
  pp.updated_by,

  -- Related entity names
  o.name                          AS organization_name,
  ps.name                         AS status_name,
  ps.step                         AS status_step,
  c.code                          AS currency_code,
  c.symbol                        AS currency_symbol,

  -- Multiple categories (JSON array)
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', pcat.id,
        'category_id', pcat.category_id,
        'category_name', cat.name,
        'category_description', cat.description
      ) ORDER BY cat.name
    )
    FROM proposal_categories pcat
    JOIN project_categories cat ON cat.id = pcat.category_id
    WHERE pcat.proposal_id = pp.id),
    '[]'::json
  ) AS categories,

  -- Audit user names
  creator.first_name || ' ' || creator.last_name  AS created_by_name,
  updater.first_name || ' ' || updater.last_name  AS updated_by_name
`;

const BASE_JOINS = `
  FROM project_proposals pp
  LEFT JOIN organizations        o   ON o.id   = pp.organization_id
  LEFT JOIN proposal_statuses    ps  ON ps.id  = pp.status_id
  LEFT JOIN currencies           c   ON c.id   = pp.currency_id
  LEFT JOIN users                creator ON creator.id = pp.created_by
  LEFT JOIN users                updater ON updater.id = pp.updated_by
`;

class ProjectProposalModel {
  /**
   * Paginated list with optional filters.
   */
  static async findAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      search = '',
      statusId = null,
      organizationId = null,
      categoryId = null,
    } = options;

    let where = `WHERE pp.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND pp.proposed_project_name ILIKE :search`;
      replacements.search = `%${search}%`;
    }
    if (statusId) {
      where += ` AND pp.status_id = :statusId`;
      replacements.statusId = statusId;
    }
    if (organizationId) {
      where += ` AND pp.organization_id = :organizationId`;
      replacements.organizationId = organizationId;
    }
    if (categoryId) {
      where += ` AND pp.project_category_id = :categoryId`;
      replacements.categoryId = categoryId;
    }

    const countQuery = `SELECT COUNT(*) AS total FROM project_proposals pp ${where}`;
    const [{ total }] = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const query = `
      SELECT ${PUBLIC_PROPOSAL_FIELDS},
        -- Total completed reviewers count for this proposal
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pp.id 
         AND pr2.status = 'Completed' 
         AND pr2.is_deleted = FALSE) AS total_approvers,
        -- Total reviewers count for this proposal
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pp.id 
         AND pr2.is_deleted = FALSE) AS total_revieweers
      ${BASE_JOINS}
      ${where}
      ORDER BY pp.created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return { rows, total: parseInt(total, 10) };
  }

  /**
   * Single proposal by ID.
   */
  static async findById(id) {
    const query = `
      SELECT ${PUBLIC_PROPOSAL_FIELDS}
      ${BASE_JOINS}
      WHERE pp.id = :id AND pp.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Create a new proposal.
   */
  static async create(data) {
    const {
      organizationId,
      statusId,
      proposedProjectName,
      description,
      landRequested,
      proposedCapitalAmount,
      currencyId,
      remarks,
      attachedDocuments,
      submittedAt,
      createdBy,
    } = data;

    const query = `
      INSERT INTO project_proposals (
        organization_id, status_id,
        proposed_project_name, description,
        land_requested, proposed_capital_amount, currency_id,
        remarks, attached_documents, submitted_at,
        created_by, updated_by
      )
      VALUES (
        :organizationId, :statusId,
        :proposedProjectName, :description,
        :landRequested, :proposedCapitalAmount, :currencyId,
        :remarks, :attachedDocuments::jsonb, :submittedAt,
        :createdBy, :createdBy
      )
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements: {
        organizationId,
        statusId,
        proposedProjectName,
        description: description || null,
        landRequested: landRequested || null,
        proposedCapitalAmount: proposedCapitalAmount ?? null,
        currencyId: currencyId || null,
        remarks: remarks || null,
        attachedDocuments: attachedDocuments ? JSON.stringify(attachedDocuments) : null,
        submittedAt: submittedAt || null,
        createdBy,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  /**
   * Update an existing proposal.
   */
  static async update(id, data) {
    const fieldMap = {
      organizationId:        'organization_id',
      statusId:              'status_id',
      proposedProjectName:   'proposed_project_name',
      description:           'description',
      landRequested:         'land_requested',
      proposedCapitalAmount: 'proposed_capital_amount',
      currencyId:            'currency_id',
      remarks:               'remarks',
      attachedDocuments:     'attached_documents',
      submittedAt:           'submitted_at',
      convertedProjectId:    'converted_project_id',
    };

    const setClauses = [];
    const replacements = { id, updatedBy: data.updatedBy };

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (data[jsKey] !== undefined) {
        if (jsKey === 'attachedDocuments') {
          setClauses.push(`${dbCol} = :${jsKey}::jsonb`);
          replacements[jsKey] = data[jsKey] ? JSON.stringify(data[jsKey]) : null;
        } else {
          setClauses.push(`${dbCol} = :${jsKey}`);
          replacements[jsKey] = data[jsKey] ?? null;
        }
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');

    const query = `
      UPDATE project_proposals
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id
    `;
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  /**
   * Soft delete.
   */
  static async softDelete(id, deletedBy) {
    await db.query(
      `UPDATE project_proposals
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
       WHERE id = :id AND is_deleted = FALSE`,
      { replacements: { id, deletedBy } }
    );
  }

  /**
   * Update status only.
   */
  static async updateStatus(id, statusId, updatedBy = null) {
    const query = `
      UPDATE project_proposals
      SET status_id = :statusId,
          updated_at = NOW()
          ${updatedBy ? ', updated_by = :updatedBy' : ''}
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, status_id
    `;
    const replacements = { id, statusId };
    if (updatedBy) replacements.updatedBy = updatedBy;
    
    const rows = await db.query(query, { replacements, type: QueryTypes.UPDATE });
    return rows[0] || null;
  }
}

module.exports = ProjectProposalModel;
