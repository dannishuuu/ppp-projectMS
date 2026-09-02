const BuildingUnitService = require('../../services/buildingService/buildingUnits.service');

exports.getUnits = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', isRented, isForRent, buildingId, floorId } = req.query;
        
        let parsedIsRented = null;
        if (isRented === 'true' || isRented === true) parsedIsRented = true;
        else if (isRented === 'false' || isRented === false) parsedIsRented = false;

        let parsedIsForRent = null;
        if (isForRent === 'true' || isForRent === true) parsedIsForRent = true;
        else if (isForRent === 'false' || isForRent === false) parsedIsForRent = false;

        const result = await BuildingUnitService.getUnits({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
            status,
            isRented: parsedIsRented,
            isForRent: parsedIsForRent,
            buildingId,
            floorId
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

exports.getUnitById = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.getUnitById(req.params.id) }); }
    catch (error) { next(error); }
};

exports.createUnit = async (req, res, next) => {
    try { return res.status(201).json({ success: true, data: await BuildingUnitService.createUnit(req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.updateUnit = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.updateUnit(req.params.id, req.body, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleUnitStatus = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.toggleUnitStatus(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleUnitRented = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.toggleUnitRented(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.toggleUnitForRent = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.toggleUnitForRent(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};

exports.deleteUnit = async (req, res, next) => {
    try { return res.status(200).json({ success: true, data: await BuildingUnitService.deleteUnit(req.params.id, req.user?.id) }); }
    catch (error) { next(error); }
};