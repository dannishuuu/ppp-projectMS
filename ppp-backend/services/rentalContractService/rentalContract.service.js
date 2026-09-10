const db = require('../../config/database');
const { QueryTypes } = require('sequelize');
const RentalContractModel = require('../../models/rentalContract.model');
const BuildingUnitModel = require('../../models/buildingUnit.model');
const RentalPaymentTypeModel = require('../../models/rentalPaymentType.model');
const RentalPaymentsModel = require('../../models/rentalPayments.model');
const DocumentSequenceService = require('../projectService/documentSequence.service');

class RentalContractService {
  static async getContracts(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 50;
    const offset = (page - 1) * limit;

    let isActive = null;
    if (options.status === 'active' || options.isActive === 'true' || options.isActive === true) isActive = true;
    if (options.status === 'inactive' || options.isActive === 'false' || options.isActive === false) isActive = false;

    const { rows, total } = await RentalContractModel.findAll({
      limit,
      offset,
      search: options.search || '',
      isActive,
      buildingId: options.buildingId || null,
      floorId: options.floorId || null,
      unitId: options.unitId || null,
      tenantOrganizationId: options.tenantOrganizationId || null,
      rentalPaymentTypeId: options.rentalPaymentTypeId || null,
      paymentTimingId: options.paymentTimingId || null,
      sortBy: options.sortBy || 'created_at',
      sortOrder: options.sortOrder || 'DESC',
    });

    return {
      contracts: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getContractById(id) {
    const contract = await RentalContractModel.findById(id);
    if (!contract) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }
    const payments = await RentalPaymentsModel.findByContractId(id);
    return { ...contract, payments };
  }

  static async createContract(payload, actorId) {
    const {
      buildingId,
      floorId,
      unitId,
      tenantOrganizationId,
      rentalPaymentTypeId,
      paymentTimingId,
      contractStartDate,
      contractEndDate,
      rentAmountTotalPerMonth,
      rentAmountPerSquareMeter,
      remarks,
      isActive = true,
      generateSchedule = true,
      gracePeriod = 0,
    } = payload;

    // 1. Mandatory Validations
    if (!buildingId) throw this._validationError('buildingId is required');
    if (!floorId) throw this._validationError('floorId is required');
    if (!unitId) throw this._validationError('unitId is required');
    if (!tenantOrganizationId) throw this._validationError('tenantOrganizationId is required');
    if (!rentalPaymentTypeId) throw this._validationError('rentalPaymentTypeId is required');
    if (!paymentTimingId) throw this._validationError('paymentTimingId is required');
    if (!contractStartDate) throw this._validationError('contractStartDate is required');
    if (!contractEndDate) throw this._validationError('contractEndDate is required');
    if (new Date(contractEndDate) < new Date(contractStartDate)) {
      throw this._validationError('contractEndDate cannot be earlier than contractStartDate');
    }
    if (rentAmountTotalPerMonth === undefined || rentAmountTotalPerMonth === null || parseFloat(rentAmountTotalPerMonth) < 0) {
      throw this._validationError('rentAmountTotalPerMonth must be a valid positive number');
    }
    if (!remarks || !remarks.trim()) {
      throw this._validationError('Contract remarks & stipulations is required');
    }

    // 2. Grace period validation: whole number of months, never greater than the contract duration
    const graceMonths = this._normalizeGracePeriod(gracePeriod);
    const term = this._calculateContractTerm(contractStartDate, contractEndDate);
    if (graceMonths > term.totalMonths) {
      throw this._validationError(
        `Grace period cannot be greater than the contract duration (${term.totalMonths} months)`
      );
    }

    // 3. Auto-generate contract number via document sequences
    const contractNumber = await DocumentSequenceService.generateNextNumber('contract_number', actorId);

    // 3. Unit validation & snapshot
    const unit = await BuildingUnitModel.findById(unitId);
    if (!unit) {
      const err = new Error('Selected building unit not found');
      err.status = 404;
      throw err;
    }

    // Check if unit already has an active contract
    if (Boolean(isActive)) {
      const existingActiveContract = await RentalContractModel.findActiveByUnitId(unitId);
      if (existingActiveContract) {
        const err = new Error(`Unit is already actively leased under contract ${existingActiveContract.contract_number}`);
        err.status = 409;
        throw err;
      }
    }

    const unitNumber = payload.unitNumber || unit.unit_number;
    const floorNumber = payload.floorNumber !== undefined ? payload.floorNumber : unit.floor_number;
    const areaValue = payload.areaValue !== undefined ? payload.areaValue : (unit.area_value ? parseFloat(unit.area_value) : null);
    
    // Calculate rent per square meter if not provided
    let calculatedRentPerSqm = rentAmountPerSquareMeter ? parseFloat(rentAmountPerSquareMeter) : null;
    if (!calculatedRentPerSqm && areaValue && areaValue > 0) {
      calculatedRentPerSqm = parseFloat((parseFloat(rentAmountTotalPerMonth) / areaValue).toFixed(2));
    }

    // 4. Execute creation in transaction
    const transaction = await db.transaction();
    try {
      const createdContract = await RentalContractModel.create(
        {
          buildingId,
          floorId,
          unitId,
          unitNumber,
          floorNumber,
          areaValue,
          tenantOrganizationId,
          rentAmountPerSquareMeter: calculatedRentPerSqm,
          rentAmountTotalPerMonth: parseFloat(rentAmountTotalPerMonth),
          rentalPaymentTypeId,
          paymentTimingId,
          contractNumber: contractNumber.trim(),
          contractStartDate,
          contractEndDate,
          remarks,
          isActive,
          createdBy: actorId,
          gracePeriod: graceMonths,
        },
        transaction
      );

      // If contract is active, update building_units is_rented = true
      if (Boolean(isActive)) {
        await db.query(
          `UPDATE building_units SET is_rented = true, updated_by = :actorId, updated_at = NOW() WHERE id = :unitId`,
          { replacements: { unitId, actorId }, type: QueryTypes.UPDATE, transaction }
        );
      }

      // Auto-generate initial payment schedule if requested
      if (generateSchedule) {
        await this._generateScheduleForContract(createdContract, transaction, actorId);
      }

      await transaction.commit();
      return this.getContractById(createdContract.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateContract(id, payload, actorId) {
    const current = await RentalContractModel.findById(id);
    if (!current) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }

    if (current.is_active) {
      const err = new Error('Active contracts cannot be edited. Please deactivate the contract first.');
      err.status = 400;
      throw err;
    }

    if (payload.contractNumber && payload.contractNumber.trim() !== current.contract_number) {
      const existing = await RentalContractModel.findByContractNumber(payload.contractNumber.trim(), id);
      if (existing) {
        const err = new Error(`Contract with number "${payload.contractNumber.trim()}" already exists`);
        err.status = 409;
        throw err;
      }
    }

    const startDate = payload.contractStartDate || current.contract_start_date;
    const endDate = payload.contractEndDate || current.contract_end_date;
    if (new Date(endDate) < new Date(startDate)) {
      throw this._validationError('contractEndDate cannot be earlier than contractStartDate');
    }

    // Grace period validation: whole number of months, never greater than the contract duration
    const graceMonths = payload.gracePeriod !== undefined
      ? this._normalizeGracePeriod(payload.gracePeriod)
      : this._normalizeGracePeriod(current.grace_period);
    const term = this._calculateContractTerm(startDate, endDate);
    if (graceMonths > term.totalMonths) {
      throw this._validationError(
        `Grace period cannot be greater than the contract duration (${term.totalMonths} months)`
      );
    }

    if (payload.remarks !== undefined && (!payload.remarks || !payload.remarks.trim())) {
      throw this._validationError('Contract remarks & stipulations cannot be empty');
    }

    const tenantOrganizationId = payload.tenantOrganizationId !== undefined ? payload.tenantOrganizationId : current.tenant_organization_id;
    if (!tenantOrganizationId) {
      throw this._validationError('tenantOrganizationId is required');
    }

    const unitId = payload.unitId || current.unit_id;
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : current.is_active;

    // Check if new unit is being assigned and if it's already leased
    if (unitId !== current.unit_id && isActive) {
      const existingActiveContract = await RentalContractModel.findActiveByUnitId(unitId, id);
      if (existingActiveContract) {
        const err = new Error(`Target unit is already actively leased under contract ${existingActiveContract.contract_number}`);
        err.status = 409;
        throw err;
      }
    }

    let unitNumber = payload.unitNumber;
    let floorNumber = payload.floorNumber;
    let areaValue = payload.areaValue;
    if (unitId !== current.unit_id && (!unitNumber || floorNumber === undefined)) {
      const unit = await BuildingUnitModel.findById(unitId);
      if (unit) {
        unitNumber = unitNumber || unit.unit_number;
        floorNumber = floorNumber !== undefined ? floorNumber : unit.floor_number;
        areaValue = areaValue !== undefined ? areaValue : (unit.area_value ? parseFloat(unit.area_value) : null);
      }
    }

    const totalRent = payload.rentAmountTotalPerMonth !== undefined ? parseFloat(payload.rentAmountTotalPerMonth) : parseFloat(current.rent_amount_total_per_month);
    let rentPerSqm = payload.rentAmountPerSquareMeter !== undefined ? parseFloat(payload.rentAmountPerSquareMeter) : current.rent_amount_per_square_meter;
    const finalArea = areaValue !== undefined ? areaValue : current.area_value;
    if (!rentPerSqm && finalArea && finalArea > 0 && totalRent > 0) {
      rentPerSqm = parseFloat((totalRent / finalArea).toFixed(2));
    }

    const transaction = await db.transaction();
    try {
      const updated = await RentalContractModel.update(
        id,
        {
          buildingId: payload.buildingId,
          floorId: payload.floorId,
          unitId,
          unitNumber,
          floorNumber,
          areaValue,
          tenantOrganizationId: payload.tenantOrganizationId,
          rentAmountPerSquareMeter: rentPerSqm,
          rentAmountTotalPerMonth: totalRent,
          rentalPaymentTypeId: payload.rentalPaymentTypeId,
          paymentTimingId: payload.paymentTimingId,
          contractNumber: payload.contractNumber ? payload.contractNumber.trim() : undefined,
          contractStartDate: payload.contractStartDate,
          contractEndDate: payload.contractEndDate,
          remarks: payload.remarks,
          isActive,
          updatedBy: actorId,
          gracePeriod: graceMonths,
        },
        transaction
      );

      // Handle unit rented status change if unit changed or active status changed
      if (current.unit_id !== unitId) {
        await this._syncUnitRentedStatus(current.unit_id, transaction, actorId);
      }
      await this._syncUnitRentedStatus(unitId, transaction, actorId);

      // Synchronize automated payment schedule if requested (default true)
      if (payload.generateSchedule !== false) {
        // Delete unpaid payments plus previously generated grace placeholders
        // (zero-amount installments pre-marked as paid) so the grace window is rebuilt
        await db.query(
          `DELETE FROM rental_payments WHERE rental_contract_id = :id AND (is_paid = false OR (is_paid = true AND amount_due = 0))`,
          { replacements: { id }, type: QueryTypes.DELETE, transaction }
        );

        // Check if there are any remaining real (non-grace) paid payments
        const remainingPaid = await db.query(
          `SELECT COUNT(*)::int as count FROM rental_payments WHERE rental_contract_id = :id AND is_paid = true AND amount_due > 0 AND is_deleted = false`,
          { replacements: { id }, type: QueryTypes.SELECT, transaction }
        );
        const paidCount = remainingPaid[0]?.count || 0;

        if (paidCount === 0) {
          await this._generateScheduleForContract(updated, transaction, actorId);
        } else {
          await this._generateRemainingScheduleForContract(updated, paidCount, transaction, actorId);
        }
      }

      await transaction.commit();
      return this.getContractById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async toggleContractStatus(id, actorId) {
    const current = await RentalContractModel.findById(id);
    if (!current) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }

    const nextStatus = !current.is_active;
    if (nextStatus) {
      const existing = await RentalContractModel.findActiveByUnitId(current.unit_id, id);
      if (existing) {
        const err = new Error(`Unit is already actively leased under contract ${existing.contract_number}`);
        err.status = 409;
        throw err;
      }
    }

    const transaction = await db.transaction();
    try {
      const res = await RentalContractModel.toggleStatus(id, actorId, transaction);
      await this._syncUnitRentedStatus(current.unit_id, transaction, actorId);
      await transaction.commit();
      return res;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async deleteContract(id, actorId) {
    const current = await RentalContractModel.findById(id);
    if (!current) {
      const err = new Error('Rental contract not found');
      err.status = 404;
      throw err;
    }

    const transaction = await db.transaction();
    try {
      // Soft-delete payments of this contract
      await db.query(
        `UPDATE rental_payments SET is_deleted = true, deleted_at = NOW(), deleted_by = :actorId WHERE rental_contract_id = :id AND is_deleted = false`,
        { replacements: { id, actorId }, type: QueryTypes.UPDATE, transaction }
      );

      // Soft-delete contract
      await RentalContractModel.softDelete(id, actorId, transaction);

      // Sync unit rented status
      await this._syncUnitRentedStatus(current.unit_id, transaction, actorId);

      await transaction.commit();
      return { success: true, message: 'Rental contract and associated payments deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getSummary() {
    const rows = await db.query(
      `SELECT
        COUNT(*)::int AS total_contracts,
        COUNT(*) FILTER (WHERE rc.is_active = true)::int AS active_contracts,
        COUNT(*) FILTER (WHERE rc.is_active = false)::int AS inactive_contracts,
        COALESCE(SUM(rc.rent_amount_total_per_month) FILTER (WHERE rc.is_active = true), 0)::numeric AS monthly_rent_revenue,
        (SELECT COUNT(DISTINCT unit_id)::int FROM rental_contracts WHERE is_active = true AND is_deleted = false) AS rented_units_count
       FROM rental_contracts rc
       WHERE rc.is_deleted = false`,
      { type: QueryTypes.SELECT }
    );
    return rows[0] || {
      total_contracts: 0,
      active_contracts: 0,
      inactive_contracts: 0,
      monthly_rent_revenue: 0,
      rented_units_count: 0,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  // Grace period must be a whole number of months (integer, no decimals, no negatives).
  // Empty/missing values default to 0.
  static _normalizeGracePeriod(raw) {
    if (raw === undefined || raw === null || String(raw).trim() === '') return 0;
    const str = String(raw).trim();
    if (!/^\d+$/.test(str)) {
      throw this._validationError('Grace period must be a whole number of months (integer without decimals)');
    }
    return parseInt(str, 10);
  }

  // Contract duration in days and months (1 month = 30.4375 days average, rounded to 1 decimal —
  // matches the lease term display used by the frontend).
  static _calculateContractTerm(startDate, endDate) {
    if (!startDate || !endDate) return { totalDays: 0, totalMonths: 0 };
    const [sY, sM, sD] = String(startDate).split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = String(endDate).split('T')[0].split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const totalDays = Math.ceil((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
    const totalMonths = Math.max(0, Math.round((totalDays / 30.4375) * 10) / 10);
    return { totalDays, totalMonths };
  }

  // "Month" unit for grace conversion: the rental payment type whose duration_days is nearest
  // to 30 (e.g. Monthly = 30). Falls back to 30 when no payment types exist.
  static async _resolveMonthDurationDays(transaction = null) {
    const rows = await db.query(
      `SELECT duration_days FROM rental_payment_types WHERE duration_days IS NOT NULL AND duration_days > 0 AND is_deleted = false`,
      { type: QueryTypes.SELECT, ...(transaction ? { transaction } : {}) }
    );
    let monthDays = 30;
    for (const row of rows || []) {
      const d = parseFloat(row.duration_days);
      if (Number.isFinite(d) && d > 0 && Math.abs(d - 30) < Math.abs(monthDays - 30)) monthDays = d;
    }
    return monthDays;
  }

  // Days of an installment cycle starting at offsetDays (each cycle is intervalDays long)
  // that fall inside the grace window (the first graceDays days of the contract).
  static _graceOverlapDays(offsetDays, intervalDays, graceDays) {
    if (graceDays <= 0) return 0;
    return Math.max(0, Math.min(intervalDays, graceDays - offsetDays));
  }

  static async _syncUnitRentedStatus(unitId, transaction, actorId) {
    if (!unitId) return;
    const activeContracts = await db.query(
      `SELECT COUNT(*)::int as count FROM rental_contracts WHERE unit_id = :unitId AND is_active = true AND is_deleted = false`,
      { replacements: { unitId }, type: QueryTypes.SELECT, transaction }
    );
    const hasActiveContract = (activeContracts[0]?.count || 0) > 0;
    await db.query(
      `UPDATE building_units SET is_rented = :isRented, updated_by = :actorId, updated_at = NOW() WHERE id = :unitId`,
      { replacements: { unitId, isRented: hasActiveContract, actorId }, type: QueryTypes.UPDATE, transaction }
    );
  }

  static async _generateScheduleForContract(contract, transaction, actorId) {
    if (!contract) return;
    const paymentTypeId = contract.rental_payment_type_id || contract.rentalPaymentTypeId;
    const paymentType = paymentTypeId ? await RentalPaymentTypeModel.findById(paymentTypeId) : null;
    const durationDays = paymentType?.duration_days ? parseFloat(paymentType.duration_days) : (contract.payment_duration_days || 30);
    const intervalDays = durationDays > 0 ? durationDays : 30;

    const startDateStr = contract.contract_start_date || contract.contractStartDate;
    const endDateStr = contract.contract_end_date || contract.contractEndDate;
    if (!startDateStr || !endDateStr) return;

    const [sY, sM, sD] = String(startDateStr).split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = String(endDateStr).split('T')[0].split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const diffMs = endUTC - startUTC;
    if (diffMs < 0) return;

    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    // Round up when decimal is >= 0.5 (e.g. 30.4 -> 30, but 30.5 or 30.6 -> 31)
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= 0) return;

    const monthlyRent = parseFloat(contract.rent_amount_total_per_month || contract.rentAmountTotalPerMonth) || 0;
    // Amount per cycle based on duration ratio (assuming monthly rent = 30 days)
    const amountPerCycle = parseFloat(((monthlyRent / 30) * intervalDays).toFixed(2));

    // Grace period (months) → days using the payment-type month unit (duration_days nearest to 30).
    // Only the portion of each installment that falls inside the grace window is deducted, so an
    // annual cycle loses one month of rent, not the whole year.
    const rawGrace = parseInt(contract.grace_period ?? contract.gracePeriod, 10);
    const graceMonths = Number.isFinite(rawGrace) && rawGrace > 0 ? rawGrace : 0;
    const monthDays = graceMonths > 0 ? await this._resolveMonthDurationDays(transaction) : 30;
    const graceDays = graceMonths * monthDays;

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let currentDue = new Date(sY, sM - 1, sD);
    const endBound = new Date(eY, eM - 1, eD);

    for (let count = 1; count <= numberOfSchedules; count++) {
      const nextDue = new Date(currentDue);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      const dueDateStr = formatYMD(currentDue);
      const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;

      const offsetDays = (count - 1) * intervalDays;
      const overlapDays = this._graceOverlapDays(offsetDays, intervalDays, graceDays);
      const chargeableDays = intervalDays - overlapDays;
      const isGraceCycle = chargeableDays <= 0;
      const baseAmount = amountPerCycle > 0 ? amountPerCycle : monthlyRent;
      const amountDue = isGraceCycle
        ? 0
        : chargeableDays < intervalDays
          ? parseFloat((baseAmount * (chargeableDays / intervalDays)).toFixed(2))
          : baseAmount;

      await RentalPaymentsModel.create(
        {
          rentalContractId: contract.id,
          amountDue,
          amountPaid: 0,
          dueDate: dueDateStr,
          nextPaymentDate: nextDateStr,
          isPaid: isGraceCycle,
          transactionReference: null,
          remarks: isGraceCycle ? `Grace period #${count} (no charge)` : `Scheduled payment #${count}`,
          createdBy: actorId,
        },
        transaction
      );

      currentDue = nextDue;
    }
  }

  static async _generateRemainingScheduleForContract(contract, paidCount, transaction, actorId) {
    if (!contract) return;
    const paymentTypeId = contract.rental_payment_type_id || contract.rentalPaymentTypeId;
    const paymentType = paymentTypeId ? await RentalPaymentTypeModel.findById(paymentTypeId) : null;
    const durationDays = paymentType?.duration_days ? parseFloat(paymentType.duration_days) : (contract.payment_duration_days || 30);
    const intervalDays = durationDays > 0 ? durationDays : 30;

    const startDateStr = contract.contract_start_date || contract.contractStartDate;
    const endDateStr = contract.contract_end_date || contract.contractEndDate;
    if (!startDateStr || !endDateStr) return;

    const [sY, sM, sD] = String(startDateStr).split('T')[0].split('-').map(Number);
    const [eY, eM, eD] = String(endDateStr).split('T')[0].split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const diffMs = endUTC - startUTC;
    if (diffMs < 0) return;

    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= paidCount) return;

    const monthlyRent = parseFloat(contract.rent_amount_total_per_month || contract.rentAmountTotalPerMonth) || 0;
    const amountPerCycle = parseFloat(((monthlyRent / 30) * intervalDays).toFixed(2));

    // Grace period (months) → days using the payment-type month unit (duration_days nearest to 30).
    // Installment cycles are dated from the contract start, so the grace window covers the first
    // graceDays days regardless of how many real payments already exist.
    const rawGrace = parseInt(contract.grace_period ?? contract.gracePeriod, 10);
    const graceMonths = Number.isFinite(rawGrace) && rawGrace > 0 ? rawGrace : 0;
    const monthDays = graceMonths > 0 ? await this._resolveMonthDurationDays(transaction) : 30;
    const graceDays = graceMonths * monthDays;

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let currentDue = new Date(sY, sM - 1, sD);
    const endBound = new Date(eY, eM - 1, eD);

    // Fast-forward past the paid installments
    for (let count = 1; count <= paidCount; count++) {
      currentDue.setDate(currentDue.getDate() + intervalDays);
    }

    for (let count = paidCount + 1; count <= numberOfSchedules; count++) {
      const nextDue = new Date(currentDue);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      const dueDateStr = formatYMD(currentDue);
      const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;

      const offsetDays = (count - 1) * intervalDays;
      const overlapDays = this._graceOverlapDays(offsetDays, intervalDays, graceDays);
      const chargeableDays = intervalDays - overlapDays;
      const isGraceCycle = chargeableDays <= 0;
      const baseAmount = amountPerCycle > 0 ? amountPerCycle : monthlyRent;
      const amountDue = isGraceCycle
        ? 0
        : chargeableDays < intervalDays
          ? parseFloat((baseAmount * (chargeableDays / intervalDays)).toFixed(2))
          : baseAmount;

      await RentalPaymentsModel.create(
        {
          rentalContractId: contract.id,
          amountDue,
          amountPaid: 0,
          dueDate: dueDateStr,
          nextPaymentDate: nextDateStr,
          isPaid: isGraceCycle,
          transactionReference: null,
          remarks: isGraceCycle ? `Grace period #${count} (no charge)` : `Scheduled payment #${count}`,
          createdBy: actorId,
        },
        transaction
      );

      currentDue = nextDue;
    }
  }

  static _validationError(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
  }
}

module.exports = RentalContractService;
