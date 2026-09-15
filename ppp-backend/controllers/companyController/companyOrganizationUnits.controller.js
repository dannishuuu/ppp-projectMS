// controllers/companyController/companyOrganizationUnits.controller.js
const OrgUnitService = require('../../services/companyService/companyOrganizationUnits.service');

exports.getUnits = async (req, res, next) => {
  try {
    const result = await OrgUnitService.getUnits(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getCompanyTree = async (req, res, next) => {
  try {
    const result = await OrgUnitService.getTreeForCompany(req.params.companyId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getUnitById = async (req, res, next) => {
  try {
    const result = await OrgUnitService.getUnitById(req.params.id);
    return res.status(200).json({ success: true, data: { unit: result } });
  } catch (error) { next(error); }
};

exports.getUnitPath = async (req, res, next) => {
  try {
    const result = await OrgUnitService.getUnitPath(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getUnitDescendants = async (req, res, next) => {
  try {
    const result = await OrgUnitService.getDescendants(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.createUnit = async (req, res, next) => {
  try {
    const result = await OrgUnitService.createUnit(req.body, req.user?.id);
    return res.status(201).json({ success: true, data: { unit: result } });
  } catch (error) { next(error); }
};

exports.updateUnit = async (req, res, next) => {
  try {
    const result = await OrgUnitService.updateUnit(req.params.id, req.body, req.user?.id);
    return res.status(200).json({ success: true, data: { unit: result } });
  } catch (error) { next(error); }
};

exports.moveUnit = async (req, res, next) => {
  try {
    const result = await OrgUnitService.moveUnit(req.params.id, req.body, req.user?.id);
    return res.status(200).json({ success: true, data: { unit: result } });
  } catch (error) { next(error); }
};

exports.toggleUnitStatus = async (req, res, next) => {
  try {
    const result = await OrgUnitService.toggleUnitStatus(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.deleteUnit = async (req, res, next) => {
  try {
    const result = await OrgUnitService.deleteUnit(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
