const PaymentTimingService = require('../../services/foundationService/paymentTimings.service');

exports.getPaymentTimings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await PaymentTimingService.getPaymentTimings({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getPaymentTimingById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await PaymentTimingService.getPaymentTimingById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createPaymentTiming = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await PaymentTimingService.createPaymentTiming(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updatePaymentTiming = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await PaymentTimingService.updatePaymentTiming(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.togglePaymentTimingStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await PaymentTimingService.togglePaymentTimingStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deletePaymentTiming = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await PaymentTimingService.deletePaymentTiming(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};