const ZoneService = require('../../services/foundationService/zones.service');

exports.getZones = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', regionId } = req.query;
    const result = await ZoneService.getZones({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status, regionId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getZoneById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ZoneService.getZoneById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createZone = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await ZoneService.createZone(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateZone = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ZoneService.updateZone(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleZoneStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ZoneService.toggleZoneStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteZone = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ZoneService.deleteZone(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};