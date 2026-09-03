const RentalPaymentsService = require('../../services/rentalContractService/rentalPayments.service');

exports.getPayments = async (req, res, next) => {
  try {
    const result = await RentalPaymentsService.getPayments(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await RentalPaymentsService.getPaymentById(req.params.id);
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentsByContract = async (req, res, next) => {
  try {
    const payments = await RentalPaymentsService.getPaymentsByContract(req.params.contractId);
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const payment = await RentalPaymentsService.createPayment(req.body, req.user?.id);
    return res.status(201).json({
      success: true,
      message: 'Rental payment schedule created successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await RentalPaymentsService.updatePayment(req.params.id, req.body, req.user?.id);
    return res.status(200).json({
      success: true,
      message: 'Rental payment schedule updated successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const payment = await RentalPaymentsService.recordPayment(req.params.id, req.body, req.user?.id);
    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateSchedule = async (req, res, next) => {
  try {
    const schedules = await RentalPaymentsService.generateSchedule(req.params.contractId, req.user?.id);
    return res.status(200).json({
      success: true,
      message: 'Payment schedules generated successfully',
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const result = await RentalPaymentsService.deletePayment(req.params.id, req.user?.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getPaymentStats = async (req, res, next) => {
  try {
    const stats = await RentalPaymentsService.getPaymentStats(req.query);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
