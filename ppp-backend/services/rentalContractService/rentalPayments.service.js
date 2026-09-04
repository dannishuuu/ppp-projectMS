const db = require('../../config/database');
const { QueryTypes } = require('sequelize');
const RentalPaymentsModel = require('../../models/rentalPayments.model');
const RentalContractModel = require('../../models/rentalContract.model');
const RentalPaymentTypeModel = require('../../models/rentalPaymentType.model');

class RentalPaymentsService {
  static async getPayments(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 50;
    const offset = (page - 1) * limit;

    let isPaid = null;
    if (options.isPaid === 'true' || options.isPaid === true) isPaid = true;
    if (options.isPaid === 'false' || options.isPaid === false) isPaid = false;

    const { rows, total } = await RentalPaymentsModel.findAll({
      limit,
      offset,
      search: options.search || '',
      isPaid,
      rentalContractId: options.rentalContractId || null,
      buildingId: options.buildingId || null,
      tenantOrganizationId: options.tenantOrganizationId || null,
      dueFromDate: options.dueFromDate || null,
      dueToDate: options.dueToDate || null,
      sortBy: options.sortBy || 'due_date',
      sortOrder: options.sortOrder || 'ASC',
    });

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getPaymentById(id) {
    const payment = await RentalPaymentsModel.findById(id);
    if (!payment) {
      const err = new Error('Rental payment record not found');
      err.status = 404;
      throw err;
    }
    return payment;
  }

  static async getPaymentsByContract(contractId) {
    const contract = await RentalContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }
    return RentalPaymentsModel.findByContractId(contractId);
  }

  static async createPayment(payload, actorId) {
    const { rentalContractId, amountDue, dueDate, amountPaid = 0, paymentDate, transactionReference, remarks } = payload;

    if (!rentalContractId) throw this._validationError('rentalContractId is required');
    if (amountDue === undefined || amountDue === null || parseFloat(amountDue) < 0) {
      throw this._validationError('amountDue must be a positive number');
    }
    if (!dueDate) throw this._validationError('dueDate is required');

    const contract = await RentalContractModel.findById(rentalContractId);
    if (!contract) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }

    // Calculate next payment date based on payment type duration
    const paymentType = await RentalPaymentTypeModel.findById(contract.rental_payment_type_id);
    const durationDays = paymentType?.duration_days ? parseInt(paymentType.duration_days, 10) : 30;
    
    let nextPaymentDate = payload.nextPaymentDate || null;
    if (!nextPaymentDate && dueDate) {
      const nextDate = new Date(dueDate);
      nextDate.setDate(nextDate.getDate() + durationDays);
      nextPaymentDate = nextDate.toISOString().split('T')[0];
    }

    const isPaid = parseFloat(amountPaid) >= parseFloat(amountDue);

    return RentalPaymentsModel.create({
      rentalContractId,
      amountDue: parseFloat(amountDue),
      amountPaid: parseFloat(amountPaid || 0),
      dueDate,
      paymentDate: paymentDate || (isPaid ? new Date().toISOString().split('T')[0] : null),
      nextPaymentDate,
      isPaid,
      transactionReference,
      remarks,
      createdBy: actorId,
    });
  }

  static async updatePayment(id, payload, actorId) {
    const current = await RentalPaymentsModel.findById(id);
    if (!current) {
      const err = new Error('Rental payment record not found');
      err.status = 404;
      throw err;
    }

    const amountDue = payload.amountDue !== undefined ? parseFloat(payload.amountDue) : parseFloat(current.amount_due);
    const amountPaid = payload.amountPaid !== undefined ? parseFloat(payload.amountPaid) : parseFloat(current.amount_paid);
    const isPaid = payload.isPaid !== undefined ? Boolean(payload.isPaid) : amountPaid >= amountDue;

    return RentalPaymentsModel.update(id, {
      ...payload,
      amountDue,
      amountPaid,
      isPaid,
      updatedBy: actorId,
    });
  }

  static async recordPayment(id, payload, actorId) {
    const current = await RentalPaymentsModel.findById(id);
    if (!current) {
      const err = new Error('Rental payment record not found');
      err.status = 404;
      throw err;
    }

    const amountPaid = parseFloat(payload.amountPaid);
    if (isNaN(amountPaid) || amountPaid < 0) {
      throw this._validationError('amountPaid must be a valid positive number');
    }

    const paymentDate = payload.paymentDate || new Date().toISOString().split('T')[0];
    const contract = await RentalContractModel.findById(current.rental_contract_id);
    const paymentType = contract ? await RentalPaymentTypeModel.findById(contract.rental_payment_type_id) : null;
    const durationDays = paymentType?.duration_days ? parseInt(paymentType.duration_days, 10) : 30;

    let nextPaymentDate = payload.nextPaymentDate || current.next_payment_date;
    if (!nextPaymentDate && current.due_date) {
      const nextDate = new Date(current.due_date);
      nextDate.setDate(nextDate.getDate() + durationDays);
      nextPaymentDate = nextDate.toISOString().split('T')[0];
    }

    return RentalPaymentsModel.recordPayment(id, {
      amountPaid,
      paymentDate,
      nextPaymentDate,
      transactionReference: payload.transactionReference,
      remarks: payload.remarks,
      updatedBy: actorId,
    });
  }

  static async generateSchedule(contractId, actorId) {
    const contract = await RentalContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }

    const paymentType = await RentalPaymentTypeModel.findById(contract.rental_payment_type_id);
    const durationDays = paymentType?.duration_days ? parseInt(paymentType.duration_days, 10) : 30;
    const intervalDays = durationDays > 0 ? durationDays : 30;

    const startDateStr = contract.contract_start_date;
    const endDateStr = contract.contract_end_date;
    if (!startDateStr || !endDateStr) return [];

    const [sY, sM, sD] = String(startDateStr).split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = String(endDateStr).split('T')[0].split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const diffMs = endUTC - startUTC;
    if (diffMs < 0) return [];

    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    // Round up when decimal is >= 0.5 (e.g. 30.4 -> 30, but 30.5 or 30.6 -> 31)
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= 0) return [];

    const monthlyRent = parseFloat(contract.rent_amount_total_per_month) || 0;
    const amountPerCycle = parseFloat(((monthlyRent / 30) * intervalDays).toFixed(2));

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const transaction = await db.transaction();
    try {
      // Find existing unpaid schedules to avoid duplicate creation
      const existing = await RentalPaymentsModel.findByContractId(contractId);
      const existingDueDates = new Set(existing.map((e) => e.due_date));

      let currentDue = new Date(sY, sM - 1, sD);
      const endBound = new Date(eY, eM - 1, eD);
      let count = existing.length;

      for (let i = 1; i <= numberOfSchedules; i++) {
        const dueDateStr = formatYMD(currentDue);
        const nextDue = new Date(currentDue);
        nextDue.setDate(nextDue.getDate() + intervalDays);
        const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;

        if (!existingDueDates.has(dueDateStr)) {
          count++;
          await RentalPaymentsModel.create(
            {
              rentalContractId: contract.id,
              amountDue: amountPerCycle > 0 ? amountPerCycle : monthlyRent,
              amountPaid: 0,
              dueDate: dueDateStr,
              nextPaymentDate: nextDateStr,
              isPaid: false,
              transactionReference: null,
              remarks: `Scheduled payment #${count}`,
              createdBy: actorId,
            },
            transaction
          );
        }

        currentDue = nextDue;
      }

      await transaction.commit();
      return RentalPaymentsModel.findByContractId(contractId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async deletePayment(id, actorId) {
    const current = await RentalPaymentsModel.findById(id);
    if (!current) {
      const err = new Error('Rental payment record not found');
      err.status = 404;
      throw err;
    }
    await RentalPaymentsModel.softDelete(id, actorId);
    return { success: true, message: 'Payment record deleted successfully' };
  }

  static async getPaymentStats(options = {}) {
    let where = 'WHERE rp.is_deleted = false';
    const replacements = {};

    if (options.buildingId) {
      where += ` AND rc.building_id = :buildingId`;
      replacements.buildingId = options.buildingId;
    }

    if (options.rentalContractId) {
      where += ` AND rp.rental_contract_id = :rentalContractId`;
      replacements.rentalContractId = options.rentalContractId;
    }

    const rows = await db.query(
      `SELECT
        COUNT(*)::int AS total_payments,
        COUNT(*) FILTER (WHERE rp.is_paid = true)::int AS paid_count,
        COUNT(*) FILTER (WHERE rp.is_paid = false)::int AS unpaid_count,
        COUNT(*) FILTER (WHERE rp.is_paid = false AND rp.due_date < CURRENT_DATE)::int AS overdue_count,
        COALESCE(SUM(rp.amount_due), 0)::numeric AS total_amount_due,
        COALESCE(SUM(rp.amount_paid), 0)::numeric AS total_amount_paid,
        COALESCE(SUM(rp.amount_due - rp.amount_paid) FILTER (WHERE rp.is_paid = false), 0)::numeric AS total_outstanding
       FROM rental_payments rp
       LEFT JOIN rental_contracts rc ON rc.id = rp.rental_contract_id
       ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    return rows[0] || {};
  }

  static _validationError(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
  }
}

module.exports = RentalPaymentsService;
