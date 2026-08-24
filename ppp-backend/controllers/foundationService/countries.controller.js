// controllers/foundationService/countries.controller.js
const CountryService = require('../../services/foundationService/countries.service');

exports.getCountries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await CountryService.getCountries({
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

exports.getCountryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const country = await CountryService.getCountryById(id);
    return res.status(200).json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
};

exports.createCountry = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const country = await CountryService.createCountry(req.body, actorId);
    return res.status(201).json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
};

exports.updateCountry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await CountryService.updateCountry(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleCountryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await CountryService.toggleCountryStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteCountry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await CountryService.deleteCountry(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};