// controllers/companyController/orgUnitTypes.controller.js
const OrgUnitTypeService = require('../../services/companyService/orgUnitTypes.service');

exports.getOrgUnitTypes = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.getOrgUnitTypes(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getOrgUnitTypeById = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.getOrgUnitTypeById(req.params.id);
    return res.status(200).json({ success: true, data: { orgUnitType: result } });
  } catch (error) { next(error); }
};

exports.createOrgUnitType = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.createOrgUnitType(req.body, req.user?.id);
    return res.status(201).json({ success: true, data: { orgUnitType: result } });
  } catch (error) { next(error); }
};

exports.updateOrgUnitType = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.updateOrgUnitType(req.params.id, req.body, req.user?.id);
    return res.status(200).json({ success: true, data: { orgUnitType: result } });
  } catch (error) { next(error); }
};

exports.toggleOrgUnitTypeStatus = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.toggleOrgUnitTypeStatus(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.deleteOrgUnitType = async (req, res, next) => {
  try {
    const result = await OrgUnitTypeService.deleteOrgUnitType(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
