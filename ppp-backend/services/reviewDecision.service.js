const ReviewDecisionModel = require('../models/reviewDecision.model');

class ReviewDecisionService {
  static async getAllDecisions(options = {}) {
    return ReviewDecisionModel.findAll(options);
  }

  static async getDecisionById(id) {
    return ReviewDecisionModel.findById(id);
  }

  static async createDecision(data, userId) {
    return ReviewDecisionModel.create({ ...data, createdBy: userId });
  }

  static async updateDecision(id, data, userId) {
    return ReviewDecisionModel.update(id, { ...data, updatedBy: userId });
  }

  static async deleteDecision(id, userId) {
    return ReviewDecisionModel.softDelete(id, userId);
  }
}

module.exports = ReviewDecisionService;