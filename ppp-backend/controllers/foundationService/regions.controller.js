const RegionService = require('../../services/foundationService/regions.service');

exports.getRegions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', countryId } = req.query;
    const result = await RegionService.getRegions({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status, countryId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getRegionById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RegionService.getRegionById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createRegion = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await RegionService.createRegion(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateRegion = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RegionService.updateRegion(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleRegionStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RegionService.toggleRegionStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteRegion = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await RegionService.deleteRegion(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};