const BuildingTypeService = require('../../services/foundationService/buildingTypes.service');

exports.getBuildingTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await BuildingTypeService.getBuildingTypes({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getBuildingTypeById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await BuildingTypeService.getBuildingTypeById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createBuildingType = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await BuildingTypeService.createBuildingType(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateBuildingType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await BuildingTypeService.updateBuildingType(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleBuildingTypeStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await BuildingTypeService.toggleBuildingTypeStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteBuildingType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await BuildingTypeService.deleteBuildingType(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};