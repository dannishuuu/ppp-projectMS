const ServiceChargeTypeService = require('../../services/foundationService/serviceChargeType.service');

exports.getServiceChargeTypes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await ServiceChargeTypeService.getServiceChargeTypes({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getServiceChargeTypeById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await ServiceChargeTypeService.getServiceChargeTypeById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createServiceChargeType = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await ServiceChargeTypeService.createServiceChargeType(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateServiceChargeType = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await ServiceChargeTypeService.updateServiceChargeType(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleServiceChargeTypeStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await ServiceChargeTypeService.toggleServiceChargeTypeStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteServiceChargeType = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await ServiceChargeTypeService.deleteServiceChargeType(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};