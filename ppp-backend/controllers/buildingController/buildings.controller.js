const BuildingService = require('../../services/buildingService/buildings.service');

exports.getBuildings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', buildingTypeId, regionId, zoneId, woredaId } = req.query;
        const result = await BuildingService.getBuildings({
            page: parseInt(page, 10), limit: parseInt(limit, 10), search, status, buildingTypeId, regionId, zoneId, woredaId
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getBuildingById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingService.getBuildingById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createBuilding = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await BuildingService.createBuilding(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateBuilding = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingService.updateBuilding(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleBuildingStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingService.toggleBuildingStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteBuilding = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingService.deleteBuilding(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};