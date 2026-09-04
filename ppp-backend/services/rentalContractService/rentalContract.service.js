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
    } = payload;

    // 1. Mandatory Validations
    if (!buildingId) throw this._validationError('buildingId is required');
    if (!floorId) throw this._validationError('floorId is required');
    if (!unitId) throw this._validationError('unitId is required');
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

    // 2. Auto-generate contract number via document sequences
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
        },
        transaction
      );

      // Handle unit rented status change if unit changed or active status changed
      if (current.unit_id !== unitId) {
        await this._syncUnitRentedStatus(current.unit_id, transaction, actorId);
      }
      await this._syncUnitRentedStatus(unitId, transaction, actorId);

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
    const durationDays = paymentType?.duration_days ? parseInt(paymentType.duration_days, 10) : (contract.payment_duration_days || 30);
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
