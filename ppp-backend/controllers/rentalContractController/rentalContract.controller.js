const RentalContractService = require('../../services/rentalContractService/rentalContract.service');

exports.getContracts = async (req, res, next) => {
  try {
    const result = await RentalContractService.getContracts(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getContractById = async (req, res, next) => {
  try {
    const contract = await RentalContractService.getContractById(req.params.id);
    return res.status(200).json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
};

exports.createContract = async (req, res, next) => {
  try {
    const contract = await RentalContractService.createContract(req.body, req.user?.id);
    return res.status(201).json({
      success: true,
      message: 'Rental contract created successfully',
      data: contract,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContract = async (req, res, next) => {
  try {
    const contract = await RentalContractService.updateContract(req.params.id, req.body, req.user?.id);
    return res.status(200).json({
      success: true,
      message: 'Rental contract updated successfully',
      data: contract,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleContractStatus = async (req, res, next) => {
  try {
    const result = await RentalContractService.toggleContractStatus(req.params.id, req.user?.id);
    return res.status(200).json({
      success: true,
      message: 'Rental contract status updated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteContract = async (req, res, next) => {
  try {
    const result = await RentalContractService.deleteContract(req.params.id, req.user?.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getContractSummary = async (req, res, next) => {
  try {
    const summary = await RentalContractService.getSummary();
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
