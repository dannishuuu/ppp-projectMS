const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_RENTAL_PAYMENT_FIELDS = `
  rp.id,
  rp.rental_contract_id,
  rp.amount_due,
  rp.amount_paid,
  rp.due_date,
  rp.payment_date,
  rp.next_payment_date,
  rp.is_paid,
  rp.transaction_reference,
  rp.remarks,
  rp.created_at,
  rp.updated_at,
  rp.created_by,
  rp.updated_by,
  rc.contract_number,
  rc.unit_number,
  rc.floor_number,
  rc.building_id,
  rc.rent_amount_total_per_month,
  rc.contract_start_date,
  rc.contract_end_date,
  b.name AS building_name,
  org.id AS tenant_organization_id,
  org.name AS tenant_organization_name,
  rpt.name AS rental_payment_type_name,
  rpt.duration_days AS payment_duration_days,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

const PAYMENT_JOINS = `
  LEFT JOIN rental_contracts rc ON rc.id = rp.rental_contract_id
  LEFT JOIN buildings b ON b.id = rc.building_id
  LEFT JOIN organizations org ON org.id = rc.tenant_organization_id
  LEFT JOIN rental_payment_types rpt ON rpt.id = rc.rental_payment_type_id
  LEFT JOIN users creator ON creator.id = rp.created_by
  LEFT JOIN users updater ON updater.id = rp.updated_by
`;

class RentalPaymentsModel {
  static async findAll(options = {}) {
    const {
      limit = 50,
      offset = 0,
      search = '',
      isPaid = null,
      rentalContractId,
      buildingId,
      tenantOrganizationId,
      dueFromDate,
      dueToDate,
      sortBy = 'due_date',
      sortOrder = 'ASC',
    } = options;

    let where = 'WHERE rp.is_deleted = false';
    const replacements = {};

    if (isPaid !== null && isPaid !== undefined) {
      where += ` AND rp.is_paid = :isPaid`;
      replacements.isPaid = isPaid;
    }

    if (rentalContractId) {
      where += ` AND rp.rental_contract_id = :rentalContractId`;
      replacements.rentalContractId = rentalContractId;
    }

    if (buildingId) {
      where += ` AND rc.building_id = :buildingId`;
      replacements.buildingId = buildingId;
    }

    if (tenantOrganizationId) {
      where += ` AND rc.tenant_organization_id = :tenantOrganizationId`;
      replacements.tenantOrganizationId = tenantOrganizationId;
    }

    if (dueFromDate) {
      where += ` AND rp.due_date >= :dueFromDate`;
      replacements.dueFromDate = dueFromDate;
    }

    if (dueToDate) {
      where += ` AND rp.due_date <= :dueToDate`;
      replacements.dueToDate = dueToDate;
    }

    if (search && search.trim()) {
      where += ` AND (
        rp.transaction_reference ILIKE :search
        OR rp.remarks ILIKE :search
        OR rc.contract_number ILIKE :search
        OR rc.unit_number ILIKE :search
        OR b.name ILIKE :search
        OR org.name ILIKE :search
      )`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM rental_payments rp ${PAYMENT_JOINS} ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortFields = {
      due_date: 'rp.due_date',
      payment_date: 'rp.payment_date',
      next_payment_date: 'rp.next_payment_date',
      amount_due: 'rp.amount_due',
      amount_paid: 'rp.amount_paid',
      created_at: 'rp.created_at',
      is_paid: 'rp.is_paid',
    };
    const validSort = validSortFields[sortBy] || 'rp.due_date';
    const validOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(
      `SELECT ${PUBLIC_RENTAL_PAYMENT_FIELDS}
       FROM rental_payments rp
       ${PAYMENT_JOINS}
       ${where}
       ORDER BY ${validSort} ${validOrder}
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query(
      `SELECT ${PUBLIC_RENTAL_PAYMENT_FIELDS}
       FROM rental_payments rp
       ${PAYMENT_JOINS}
       WHERE rp.id = :id AND rp.is_deleted = false
       LIMIT 1`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    return rows[0] || null;
  }

  static async findByContractId(contractId) {
    return db.query(
      `SELECT ${PUBLIC_RENTAL_PAYMENT_FIELDS}
       FROM rental_payments rp
       ${PAYMENT_JOINS}
       WHERE rp.rental_contract_id = :contractId AND rp.is_deleted = false
       ORDER BY rp.due_date ASC`,
      { replacements: { contractId }, type: QueryTypes.SELECT }
    );
  }

  static async create(data, transaction = null) {
    const rows = await db.query(
      `INSERT INTO rental_payments (
        rental_contract_id, amount_due, amount_paid,
        due_date, payment_date, next_payment_date,
        is_paid, transaction_reference, remarks,
        is_deleted, created_by, updated_by
      ) VALUES (
        :rentalContractId, :amountDue, COALESCE(:amountPaid, 0),
        :dueDate, :paymentDate, :nextPaymentDate,
        COALESCE(:isPaid, false), :transactionReference, :remarks,
        false, :createdBy, :createdBy
      )
      RETURNING id`,
      {
        replacements: {
          rentalContractId: data.rentalContractId,
          amountDue: data.amountDue,
          amountPaid: data.amountPaid || 0,
          dueDate: data.dueDate,
          paymentDate: data.paymentDate || null,
          nextPaymentDate: data.nextPaymentDate || null,
          isPaid: data.isPaid !== undefined ? Boolean(data.isPaid) : false,
          transactionReference: data.transactionReference || null,
          remarks: data.remarks || null,
          createdBy: data.createdBy || null,
        },
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    return rows[0]?.id ? this.findById(rows[0].id) : null;
  }

  static async update(id, data, transaction = null) {
    await db.query(
      `UPDATE rental_payments SET
        rental_contract_id = COALESCE(:rentalContractId, rental_contract_id),
        amount_due = COALESCE(:amountDue, amount_due),
        amount_paid = COALESCE(:amountPaid, amount_paid),
        due_date = COALESCE(:dueDate, due_date),
        payment_date = :paymentDate,
        next_payment_date = :nextPaymentDate,
        is_paid = COALESCE(:isPaid, is_paid),
        transaction_reference = :transactionReference,
        remarks = :remarks,
        updated_by = :updatedBy,
        updated_at = NOW(),
        is_deleted = false,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = :id AND is_deleted = false`,
      {
        replacements: {
          id,
          rentalContractId: data.rentalContractId || null,
          amountDue: data.amountDue || null,
          amountPaid: data.amountPaid !== undefined ? data.amountPaid : null,
          dueDate: data.dueDate || null,
          paymentDate: data.paymentDate !== undefined ? data.paymentDate : null,
          nextPaymentDate: data.nextPaymentDate !== undefined ? data.nextPaymentDate : null,
          isPaid: data.isPaid !== undefined ? Boolean(data.isPaid) : null,
          transactionReference: data.transactionReference !== undefined ? data.transactionReference : null,
          remarks: data.remarks !== undefined ? data.remarks : null,
          updatedBy: data.updatedBy || null,
        },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
    return this.findById(id);
  }

  static async recordPayment(id, data, transaction = null) {
    const current = await this.findById(id);
    if (!current) throw new Error('Payment schedule not found');

    const amountPaid = parseFloat(data.amountPaid !== undefined ? data.amountPaid : current.amount_paid);
    const amountDue = parseFloat(current.amount_due);
    const isPaid = amountPaid >= amountDue;
    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];

    await db.query(
      `UPDATE rental_payments SET
        amount_paid = :amountPaid,
        payment_date = :paymentDate,
        next_payment_date = COALESCE(:nextPaymentDate, next_payment_date),
        is_paid = :isPaid,
        transaction_reference = COALESCE(:transactionReference, transaction_reference),
        remarks = COALESCE(:remarks, remarks),
        updated_by = :updatedBy,
        updated_at = NOW()
      WHERE id = :id AND is_deleted = false`,
      {
        replacements: {
          id,
          amountPaid,
          paymentDate,
          nextPaymentDate: data.nextPaymentDate || null,
          isPaid,
          transactionReference: data.transactionReference || null,
          remarks: data.remarks || null,
          updatedBy: data.updatedBy || null,
        },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
    return this.findById(id);
  }

  static async softDelete(id, deletedBy = null, transaction = null) {
    await db.query(
      `UPDATE rental_payments SET
        is_deleted = true,
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

module.exports = RentalPaymentsModel;
