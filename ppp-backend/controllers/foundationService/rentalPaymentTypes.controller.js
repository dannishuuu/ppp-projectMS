const RentalPaymentTypeService = require('../../services/foundationService/rentalPaymentTypes.service');

exports.getRentalPaymentTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await RentalPaymentTypeService.getRentalPaymentTypes({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getRentalPaymentTypeById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RentalPaymentTypeService.getRentalPaymentTypeById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createRentalPaymentType = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await RentalPaymentTypeService.createRentalPaymentType(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateRentalPaymentType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RentalPaymentTypeService.updateRentalPaymentType(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleRentalPaymentTypeStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RentalPaymentTypeService.toggleRentalPaymentTypeStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteRentalPaymentType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RentalPaymentTypeService.deleteRentalPaymentType(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};