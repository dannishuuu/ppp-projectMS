const ShopServiceTypeService = require('../../services/foundationService/shopServiceTypes.service');

exports.getShopServiceTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await ShopServiceTypeService.getShopServiceTypes({ page: parseInt(page, 10), limit: parseInt(limit, 10), search, status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getShopServiceTypeById = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ShopServiceTypeService.getShopServiceTypeById(req.params.id) }); } 
  catch (error) { next(error); }
};

exports.createShopServiceType = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await ShopServiceTypeService.createShopServiceType(req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.updateShopServiceType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ShopServiceTypeService.updateShopServiceType(req.params.id, req.body, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.toggleShopServiceTypeStatus = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ShopServiceTypeService.toggleShopServiceTypeStatus(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};

exports.deleteShopServiceType = async (req, res, next) => {
  try { return res.status(200).json({ success: true, data: await ShopServiceTypeService.deleteShopServiceType(req.params.id, req.user?.id) }); } 
  catch (error) { next(error); }
};