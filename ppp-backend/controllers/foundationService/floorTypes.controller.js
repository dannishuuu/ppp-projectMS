const FloorTypeService = require('../../services/foundationService/floorTypes.service');

exports.getFloorTypes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await FloorTypeService.getFloorTypes({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getFloorTypeById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await FloorTypeService.getFloorTypeById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createFloorType = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await FloorTypeService.createFloorType(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateFloorType = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await FloorTypeService.updateFloorType(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleFloorTypeStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await FloorTypeService.toggleFloorTypeStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteFloorType = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await FloorTypeService.deleteFloorType(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};