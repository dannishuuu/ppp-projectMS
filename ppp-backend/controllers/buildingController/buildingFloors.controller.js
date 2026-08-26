const BuildingFloorService = require('../../services/buildingService/buildingFloors.service');

exports.getFloors = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', buildingId } = req.query;
        const result = await BuildingFloorService.getFloors({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status, buildingId });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getFloorById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingFloorService.getFloorById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createFloor = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await BuildingFloorService.createFloor(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateFloor = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingFloorService.updateFloor(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleFloorStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingFloorService.toggleFloorStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteFloor = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingFloorService.deleteFloor(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};