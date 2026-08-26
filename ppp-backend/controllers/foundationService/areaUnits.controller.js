const AreaUnitService = require('../../services/foundationService/areaUnits.service');

exports.getAreaUnits = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await AreaUnitService.getAreaUnits({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getAreaUnitById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await AreaUnitService.getAreaUnitById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createAreaUnit = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await AreaUnitService.createAreaUnit(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateAreaUnit = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await AreaUnitService.updateAreaUnit(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleAreaUnitStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await AreaUnitService.toggleAreaUnitStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteAreaUnit = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await AreaUnitService.deleteAreaUnit(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};