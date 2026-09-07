const BusinessSectorService = require('../../services/foundationService/businessSector.service');

exports.getBusinessSectors = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await BusinessSectorService.getBusinessSectors({ 
            page: parseInt(page, 10), 
            limit: parseInt(limit, 10), 
            search, 
            status 
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error) { 
        next(error); 
    }
};

exports.getBusinessSectorById = async (req, res, next) => {
    try { 
        return res.status(200).json({ success: true, data: await BusinessSectorService.getBusinessSectorById(req.params.id) }); 
    }
    catch (error) { 
        next(error); 
    }
};

exports.createBusinessSector = async (req, res, next) => {
    try { 
        return res.status(201).json({ success: true, data: await BusinessSectorService.createBusinessSector(req.body, req.user?.id) }); 
    }
    catch (error) { 
        next(error); 
    }
};

exports.updateBusinessSector = async (req, res, next) => {
    try { 
        return res.status(200).json({ success: true, data: await BusinessSectorService.updateBusinessSector(req.params.id, req.body, req.user?.id) }); 
    }
    catch (error) { 
        next(error); 
    }
};

exports.toggleBusinessSectorStatus = async (req, res, next) => {
    try { 
        return res.status(200).json({ success: true, data: await BusinessSectorService.toggleBusinessSectorStatus(req.params.id, req.user?.id) }); 
    }
    catch (error) { 
        next(error); 
    }
};

exports.deleteBusinessSector = async (req, res, next) => {
    try { 
        return res.status(200).json({ success: true, data: await BusinessSectorService.deleteBusinessSector(req.params.id, req.user?.id) }); 
    }
    catch (error) { 
        next(error); 
    }
};