const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_RENTAL_CONTRACT_FIELDS = `
  rc.id,
  rc.building_id,
  rc.floor_id,
  rc.unit_id,
  rc.unit_number,
  rc.floor_number,
  rc.area_value,
  rc.tenant_organization_id,
  rc.rent_amount_per_square_meter,
  rc.rent_amount_total_per_month,
  rc.rental_payment_type_id,
  rc.payment_timing_id,
  rc.contract_number,
  rc.contract_start_date,
  rc.contract_end_date,
  rc.remarks,
  rc.is_active,
  rc.created_at,
  rc.updated_at,
  rc.created_by,
  rc.updated_by,
  b.name AS building_name,
  bf.name AS floor_name,
  bu.unit_number AS current_unit_number,
  bu.unit_use_type AS unit_use_type,
  org.name AS tenant_organization_name,
  rpt.name AS rental_payment_type_name,
  rpt.duration_days AS payment_duration_days,
  pt.name AS payment_timing_name,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name,
  (SELECT COUNT(*)::int FROM rental_payments rp WHERE rp.rental_contract_id = rc.id AND rp.is_deleted = false) AS payments_count,
  (SELECT COALESCE(SUM(rp.amount_paid), 0)::numeric FROM rental_payments rp WHERE rp.rental_contract_id = rc.id AND rp.is_deleted = false) AS total_amount_paid,
  (SELECT COALESCE(SUM(rp.amount_due), 0)::numeric FROM rental_payments rp WHERE rp.rental_contract_id = rc.id AND rp.is_deleted = false) AS total_amount_due
`;

const CONTRACT_JOINS = `
  LEFT JOIN buildings b ON b.id = rc.building_id
  LEFT JOIN building_floors bf ON bf.id = rc.floor_id
  LEFT JOIN building_units bu ON bu.id = rc.unit_id
  LEFT JOIN organizations org ON org.id = rc.tenant_organization_id
  LEFT JOIN rental_payment_types rpt ON rpt.id = rc.rental_payment_type_id
  LEFT JOIN payment_timings pt ON pt.id = rc.payment_timing_id
  LEFT JOIN users creator ON creator.id = rc.created_by
  LEFT JOIN users updater ON updater.id = rc.updated_by
`;

class RentalContractModel {
  static async findAll(options = {}) {
    const {
      limit = 50,
      offset = 0,
      search = '',
      isActive = null,
      buildingId,
      floorId,
      unitId,
      tenantOrganizationId,
      rentalPaymentTypeId,
      paymentTimingId,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    let where = 'WHERE rc.is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND rc.is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (buildingId) {
      where += ` AND rc.building_id = :buildingId`;
      replacements.buildingId = buildingId;
    }

    if (floorId) {
      where += ` AND rc.floor_id = :floorId`;
      replacements.floorId = floorId;
    }

    if (unitId) {
      where += ` AND rc.unit_id = :unitId`;
      replacements.unitId = unitId;
    }

    if (tenantOrganizationId) {
      where += ` AND rc.tenant_organization_id = :tenantOrganizationId`;
      replacements.tenantOrganizationId = tenantOrganizationId;
    }

    if (rentalPaymentTypeId) {
      where += ` AND rc.rental_payment_type_id = :rentalPaymentTypeId`;
      replacements.rentalPaymentTypeId = rentalPaymentTypeId;
    }

    if (paymentTimingId) {
      where += ` AND rc.payment_timing_id = :paymentTimingId`;
      replacements.paymentTimingId = paymentTimingId;
    }

    if (search && search.trim()) {
      where += ` AND (
        rc.contract_number ILIKE :search
        OR rc.unit_number ILIKE :search
        OR b.name ILIKE :search
        OR org.name ILIKE :search
        OR rc.remarks ILIKE :search
      )`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM rental_contracts rc ${CONTRACT_JOINS} ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortFields = {
      contract_number: 'rc.contract_number',
      contract_start_date: 'rc.contract_start_date',
      contract_end_date: 'rc.contract_end_date',
      rent_amount_total_per_month: 'rc.rent_amount_total_per_month',
      created_at: 'rc.created_at',
      updated_at: 'rc.updated_at',
      unit_number: 'rc.unit_number',
    };
    const validSort = validSortFields[sortBy] || 'rc.created_at';
    const validOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(
      `SELECT ${PUBLIC_RENTAL_CONTRACT_FIELDS}
       FROM rental_contracts rc
       ${CONTRACT_JOINS}
       ${where}
       ORDER BY ${validSort} ${validOrder}
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    return { rows, total };
  }

  static async findById(id, transaction = null) {
    const rows = await db.query(
      `SELECT ${PUBLIC_RENTAL_CONTRACT_FIELDS}
       FROM rental_contracts rc
       ${CONTRACT_JOINS}
       WHERE rc.id = :id AND rc.is_deleted = false
       LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
        ...(transaction ? { transaction } : {}),
      }
    );
    return rows[0] || null;
  }

  static async findByContractNumber(contractNumber, excludeId = null) {
    let sql = `SELECT * FROM rental_contracts WHERE LOWER(contract_number) = LOWER(:contractNumber) AND is_deleted = false`;
    const replacements = { contractNumber };
    if (excludeId) {
      sql += ` AND id != :excludeId`;
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(sql, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findActiveByUnitId(unitId, excludeId = null) {
    let sql = `SELECT * FROM rental_contracts WHERE unit_id = :unitId AND is_active = true AND is_deleted = false`;
    const replacements = { unitId };
    if (excludeId) {
      sql += ` AND id != :excludeId`;
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(sql, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data, transaction = null) {
    const rows = await db.query(
      `INSERT INTO rental_contracts (
        building_id, floor_id, unit_id,
        unit_number, floor_number, area_value,
        tenant_organization_id,
        rent_amount_per_square_meter, rent_amount_total_per_month,
        rental_payment_type_id, payment_timing_id,
        contract_number, contract_start_date, contract_end_date,
        remarks, is_active, is_deleted, created_by, updated_by
      ) VALUES (
        :buildingId, :floorId, :unitId,
        :unitNumber, :floorNumber, :areaValue,
        :tenantOrganizationId,
        :rentAmountPerSqm, :rentAmountTotalPerMonth,
        :rentalPaymentTypeId, :paymentTimingId,
        :contractNumber, :contractStartDate, :contractEndDate,
        :remarks, COALESCE(:isActive, true), false, :createdBy, :createdBy
      )
      RETURNING id`,
      {
        replacements: {
          buildingId: data.buildingId,
          floorId: data.floorId,
          unitId: data.unitId,
          unitNumber: data.unitNumber,
          floorNumber: data.floorNumber,
          areaValue: data.areaValue || null,
          tenantOrganizationId: data.tenantOrganizationId || null,
          rentAmountPerSqm: data.rentAmountPerSquareMeter || null,
          rentAmountTotalPerMonth: data.rentAmountTotalPerMonth,
          rentalPaymentTypeId: data.rentalPaymentTypeId,
          paymentTimingId: data.paymentTimingId,
          contractNumber: data.contractNumber,
          contractStartDate: data.contractStartDate,
          contractEndDate: data.contractEndDate,
          remarks: data.remarks || null,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          createdBy: data.createdBy || null,
        },
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    return rows[0]?.id ? this.findById(rows[0].id, transaction) : null;
  }

  static async update(id, data, transaction = null) {
    await db.query(
      `UPDATE rental_contracts SET
        building_id = COALESCE(:buildingId, building_id),
        floor_id = COALESCE(:floorId, floor_id),
        unit_id = COALESCE(:unitId, unit_id),
        unit_number = COALESCE(:unitNumber, unit_number),
        floor_number = COALESCE(:floorNumber, floor_number),
        area_value = :areaValue,
        tenant_organization_id = :tenantOrganizationId,
        rent_amount_per_square_meter = :rentAmountPerSqm,
        rent_amount_total_per_month = COALESCE(:rentAmountTotalPerMonth, rent_amount_total_per_month),
        rental_payment_type_id = COALESCE(:rentalPaymentTypeId, rental_payment_type_id),
        payment_timing_id = COALESCE(:paymentTimingId, payment_timing_id),
        contract_number = COALESCE(:contractNumber, contract_number),
        contract_start_date = COALESCE(:contractStartDate, contract_start_date),
        contract_end_date = COALESCE(:contractEndDate, contract_end_date),
        remarks = :remarks,
        is_active = COALESCE(:isActive, is_active),
        updated_by = :updatedBy,
        updated_at = NOW(),
        is_deleted = false,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = :id AND is_deleted = false`,
      {
        replacements: {
          id,
          buildingId: data.buildingId || null,
          floorId: data.floorId || null,
          unitId: data.unitId || null,
          unitNumber: data.unitNumber || null,
          floorNumber: data.floorNumber || null,
          areaValue: data.areaValue !== undefined ? data.areaValue : null,
          tenantOrganizationId: data.tenantOrganizationId !== undefined ? data.tenantOrganizationId : null,
          rentAmountPerSqm: data.rentAmountPerSquareMeter !== undefined ? data.rentAmountPerSquareMeter : null,
          rentAmountTotalPerMonth: data.rentAmountTotalPerMonth || null,
          rentalPaymentTypeId: data.rentalPaymentTypeId || null,
          paymentTimingId: data.paymentTimingId || null,
          contractNumber: data.contractNumber || null,
          contractStartDate: data.contractStartDate || null,
          contractEndDate: data.contractEndDate || null,
          remarks: data.remarks !== undefined ? data.remarks : null,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : null,
          updatedBy: data.updatedBy || null,
        },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
    return this.findById(id, transaction);
  }

  static async toggleStatus(id, updatedBy = null, transaction = null) {
    const rows = await db.query(
      `UPDATE rental_contracts SET
        is_active = NOT is_active,
        updated_by = :updatedBy,
        updated_at = NOW()
       WHERE id = :id AND is_deleted = false
       RETURNING id, is_active`,
      {
        replacements: { id, updatedBy },
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy = null, transaction = null) {
    await db.query(
      `UPDATE rental_contracts SET
        is_deleted = true,
        is_active = false,
        deleted_at = NOW(),
        deleted_by = :deletedBy,
        updated_at = NOW()
       WHERE id = :id AND is_deleted = false`,
      {
        replacements: { id, deletedBy },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
    return true;
  }
}

module.exports = RentalContractModel;
