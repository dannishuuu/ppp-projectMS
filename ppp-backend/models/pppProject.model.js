// models/pppProject.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_PROJECT_FIELDS = `
  p.id,
  p.project_no,
  p.proposal_id,
  p.name,
  p.description,
  p.address,
  p.site_area_value,
  p.site_area_unit,
  p.contract_signing_date,
  p.estimated_budget_amount,
  p.estimated_budget_currency_id,
  p.status_id,
  p.is_active,
  p.is_deleted,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by,

  -- Related status & currency
  ps.name                         AS status_name,
  ps.description                  AS status_description,
  c.code                          AS currency_code,
  c.symbol                        AS currency_symbol,
  c.name                          AS currency_name,

  -- Proposal details if converted
  prop.prop_number                AS proposal_number,
  prop.proposed_project_name      AS proposal_name,

  -- Categories (JSON array)
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', pcm.id,
        'category_id', pcm.category_id,
        'category_name', cat.name,
        'category_description', cat.description,
        'is_onland', cat.is_onland
      ) ORDER BY cat.name
    )
    FROM project_categories_map pcm
    JOIN project_categories cat ON cat.id = pcm.category_id
    WHERE pcm.project_id = p.id AND pcm.is_deleted = FALSE),
    '[]'::json
  ) AS categories,

  -- Participating Organizations (JSON array)
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', po.id,
        'organization_id', po.organization_id,
        'organization_name', org.name,
        'organization_type_id', po.organization_type_id,
        'organization_type_name', ot.name,
        'organization_type_code', ot.org_type_code
      ) ORDER BY ot.name, org.name
    )
    FROM project_organizations po
    JOIN organizations org ON org.id = po.organization_id
    JOIN organization_types ot ON ot.id = po.organization_type_id
    WHERE po.project_id = p.id AND po.is_deleted = FALSE),
    '[]'::json
  ) AS organizations,

  -- Active Project Managers (JSON array)
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', pm.id,
        'user_id', pm.user_id,
        'name', TRIM(u.first_name || ' ' || u.last_name),
        'email', u.email,
        'phone', u.phone,
        'assigned_at', pm.assigned_at,
        'remarks', pm.remarks
      ) ORDER BY pm.assigned_at DESC
    )
    FROM project_managers pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = p.id AND pm.unassigned_at IS NULL AND pm.is_deleted = FALSE),
    '[]'::json
  ) AS active_managers,

  -- Audit user names
  creator.first_name || ' ' || creator.last_name  AS created_by_name,
  updater.first_name || ' ' || updater.last_name  AS updated_by_name
`;

const BASE_JOINS = `
  FROM ppp_projects p
  LEFT JOIN project_statuses ps      ON ps.id   = p.status_id
  LEFT JOIN currencies c            ON c.id    = p.estimated_budget_currency_id
  LEFT JOIN project_proposals prop  ON prop.id = p.proposal_id
  LEFT JOIN users creator           ON creator.id = p.created_by
  LEFT JOIN users updater           ON updater.id = p.updated_by
`;

class PppProjectModel {
  /**
   * Paginated list with optional search and filters.
   */
  static async findAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      search = '',
      statusId = null,
      categoryId = null,
      organizationId = null,
      isActive = null,
    } = options;

    let where = `WHERE p.is_deleted = FALSE`;
    const replacements = {};

    if (search && search.trim()) {
      where += ` AND (p.name ILIKE :search OR p.project_no ILIKE :search OR p.address ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (statusId) {
      where += ` AND p.status_id = :statusId`;
      replacements.statusId = statusId;
    }

    if (isActive !== null && isActive !== undefined) {
      where += ` AND p.is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (categoryId) {
      where += ` AND EXISTS (
        SELECT 1 FROM project_categories_map pcm
        WHERE pcm.project_id = p.id AND pcm.category_id = :categoryId AND pcm.is_deleted = FALSE
      )`;
      replacements.categoryId = categoryId;
    }

    if (organizationId) {
      where += ` AND EXISTS (
        SELECT 1 FROM project_organizations po
        WHERE po.project_id = p.id AND po.organization_id = :organizationId AND po.is_deleted = FALSE
      )`;
      replacements.organizationId = organizationId;
    }

    const countQuery = `SELECT COUNT(*) AS total FROM ppp_projects p ${where}`;
    const [{ total }] = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const dataQuery = `
      SELECT ${PUBLIC_PROJECT_FIELDS}
      ${BASE_JOINS}
      ${where}
      ORDER BY p.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const rows = await db.query(dataQuery, {
      replacements: { ...replacements, limit, offset },
      type: QueryTypes.SELECT,
    });

    return { rows, total: parseInt(total, 10) };
  }

  /**
   * Find a single project by UUID.
   */
  static async findById(id) {
    const query = `
      SELECT ${PUBLIC_PROJECT_FIELDS}
      ${BASE_JOINS}
      WHERE p.id = :id AND p.is_deleted = FALSE
      LIMIT 1
    `;

    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Find project by project_no.
   */
  static async findByProjectNo(projectNo) {
    const query = `
      SELECT ${PUBLIC_PROJECT_FIELDS}
      ${BASE_JOINS}
      WHERE p.project_no = :projectNo AND p.is_deleted = FALSE
      LIMIT 1
    `;

    const rows = await db.query(query, {
      replacements: { projectNo },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Insert a new project row.
   */
  static async create(data, clientOptions = {}) {
    const {
      proposalId = null,
      projectNo,
      name,
      description = null,
      address = null,
      siteAreaValue = null,
      siteAreaUnit = 'Sqm',
      contractSigningDate = null,
      estimatedBudgetAmount = null,
      estimatedBudgetCurrencyId = null,
      statusId = null,
      isActive = true,
      createdBy = null,
    } = data;

    const query = `
      INSERT INTO ppp_projects (
        proposal_id,
        project_no,
        name,
        description,
        address,
        site_area_value,
        site_area_unit,
        contract_signing_date,
        estimated_budget_amount,
        estimated_budget_currency_id,
        status_id,
        is_active,
        created_by,
        updated_by
      ) VALUES (
        :proposalId,
        :projectNo,
        :name,
        :description,
        :address,
        :siteAreaValue,
        :siteAreaUnit,
        :contractSigningDate,
        :estimatedBudgetAmount,
        :estimatedBudgetCurrencyId,
        :statusId,
        :isActive,
        :createdBy,
        :createdBy
      )
      RETURNING id, project_no, name
    `;

    const rows = await db.query(query, {
      replacements: {
        proposalId,
        projectNo,
        name,
        description,
        address,
        siteAreaValue,
        siteAreaUnit,
        contractSigningDate,
        estimatedBudgetAmount,
        estimatedBudgetCurrencyId,
        statusId,
        isActive,
        createdBy,
      },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Update an existing project row.
   */
  static async update(id, data, clientOptions = {}) {
    const {
      name,
      description,
      address,
      siteAreaValue,
      siteAreaUnit,
      contractSigningDate,
      estimatedBudgetAmount,
      estimatedBudgetCurrencyId,
      statusId,
      isActive,
      updatedBy,
    } = data;

    const query = `
      UPDATE ppp_projects
      SET
        name = COALESCE(:name, name),
        description = COALESCE(:description, description),
        address = COALESCE(:address, address),
        site_area_value = COALESCE(:siteAreaValue, site_area_value),
        site_area_unit = COALESCE(:siteAreaUnit, site_area_unit),
        contract_signing_date = COALESCE(:contractSigningDate, contract_signing_date),
        estimated_budget_amount = COALESCE(:estimatedBudgetAmount, estimated_budget_amount),
        estimated_budget_currency_id = COALESCE(:estimatedBudgetCurrencyId, estimated_budget_currency_id),
        status_id = COALESCE(:statusId, status_id),
        is_active = COALESCE(:isActive, is_active),
        updated_by = :updatedBy,
        updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, project_no, name
    `;

    const rows = await db.query(query, {
      replacements: {
        id,
        name: name !== undefined ? name : null,
        description: description !== undefined ? description : null,
        address: address !== undefined ? address : null,
        siteAreaValue: siteAreaValue !== undefined ? siteAreaValue : null,
        siteAreaUnit: siteAreaUnit !== undefined ? siteAreaUnit : null,
        contractSigningDate: contractSigningDate !== undefined ? contractSigningDate : null,
        estimatedBudgetAmount: estimatedBudgetAmount !== undefined ? estimatedBudgetAmount : null,
        estimatedBudgetCurrencyId: estimatedBudgetCurrencyId !== undefined ? estimatedBudgetCurrencyId : null,
        statusId: statusId !== undefined ? statusId : null,
        isActive: isActive !== undefined ? isActive : null,
        updatedBy,
      },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0] || null;
  }

  /**
   * Update status specifically.
   */
  static async updateStatus(id, statusId, actorId) {
    const query = `
      UPDATE ppp_projects
      SET status_id = :statusId,
          updated_by = :actorId,
          updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, project_no, status_id
    `;

    const rows = await db.query(query, {
      replacements: { id, statusId, actorId },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Soft-delete a project.
   */
  static async delete(id, actorId) {
    const query = `
      UPDATE ppp_projects
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :actorId
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, project_no
    `;

    const rows = await db.query(query, {
      replacements: { id, actorId },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }
}

module.exports = PppProjectModel;
