const WoredaService = require('../../services/foundationService/woredas.service');

exports.getWoredas = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', zoneId } = req.query;
    const result = await WoredaService.getWoredas({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status, zoneId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getWoredaById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await WoredaService.getWoredaById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createWoreda = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await WoredaService.createWoreda(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateWoreda = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await WoredaService.updateWoreda(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleWoredaStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await WoredaService.toggleWoredaStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteWoreda = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await WoredaService.deleteWoreda(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};