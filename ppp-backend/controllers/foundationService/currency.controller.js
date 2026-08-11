// controllers/foundationService/currency.controller.js
const CurrencyService = require('../../services/foundationService/currency.service');

exports.getCurrencies = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await CurrencyService.getCurrencies({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getCurrencyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currency = await CurrencyService.getCurrencyById(id);
    return res.status(200).json({ success: true, data: currency });
  } catch (error) {
    next(error);
  }
};

exports.createCurrency = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const currency = await CurrencyService.createCurrency(req.body, actorId);
    return res.status(201).json({ success: true, data: currency });
  } catch (error) {
    next(error);
  }
};

exports.updateCurrency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await CurrencyService.updateCurrency(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleCurrencyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await CurrencyService.toggleCurrencyStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteCurrency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await CurrencyService.deleteCurrency(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
