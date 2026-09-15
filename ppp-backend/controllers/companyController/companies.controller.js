// controllers/companyController/companies.controller.js
const CompanyService = require('../../services/companyService/company.service');

exports.getCompanies = async (req, res, next) => {
  try {
    const result = await CompanyService.getCompanies(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getCompanyById = async (req, res, next) => {
  try {
    const result = await CompanyService.getCompanyById(req.params.id);
    return res.status(200).json({ success: true, data: { company: result } });
  } catch (error) { next(error); }
};

exports.createCompany = async (req, res, next) => {
  try {
    const result = await CompanyService.createCompany(req.body, req.user?.id);
    return res.status(201).json({ success: true, data: { company: result } });
  } catch (error) { next(error); }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const result = await CompanyService.updateCompany(req.params.id, req.body, req.user?.id);
    return res.status(200).json({ success: true, data: { company: result } });
  } catch (error) { next(error); }
};

exports.toggleCompanyStatus = async (req, res, next) => {
  try {
    const result = await CompanyService.toggleCompanyStatus(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const result = await CompanyService.deleteCompany(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
