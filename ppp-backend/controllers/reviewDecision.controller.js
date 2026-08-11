const ReviewDecisionService = require('../services/reviewDecision.service');

exports.getDecisions = async (req, res, next) => {
  try {
    const { isActive = 'true' } = req.query;
    const decisions = await ReviewDecisionService.getAllDecisions({ 
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : null 
    });
    return res.status(200).json({ success: true, data: decisions });
  } catch (error) {
    next(error);
  }
};

exports.getDecisionById = async (req, res, next) => {
  try {
    const decision = await ReviewDecisionService.getDecisionById(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found' });
    }
    return res.status(200).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

exports.createDecision = async (req, res, next) => {
  try {
    const { name, description, weight } = req.body;
    const decision = await ReviewDecisionService.createDecision(
      { name, description, weight },
      req.user?.id
    );
    return res.status(201).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

exports.updateDecision = async (req, res, next) => {
  try {
    const { name, description, weight, isActive } = req.body;
    const decision = await ReviewDecisionService.updateDecision(
      req.params.id,
      { name, description, weight, isActive },
      req.user?.id
    );
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found' });
    }
    return res.status(200).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

exports.deleteDecision = async (req, res, next) => {
  try {
    const decision = await ReviewDecisionService.deleteDecision(req.params.id, req.user?.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found' });
    }
    return res.status(200).json({ success: true, message: 'Decision deleted successfully' });
  } catch (error) {
    next(error);
  }
};