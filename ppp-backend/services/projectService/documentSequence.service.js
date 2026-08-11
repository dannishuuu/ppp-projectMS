// services/projectService/documentSequence.service.js
const DocumentSequenceModel = require('../../models/documentSequence.model');

class DocumentSequenceService {
  /**
   * Default fallback configurations for known entity types
   */
  static DEFAULTS = {
    project_proposal: { prefix: 'PROP-', paddingLength: 4, resetYearly: true },
    ppp_project:      { prefix: 'PROJ-', paddingLength: 4, resetYearly: true },
  };

  /**
   * Generate next document sequence string for an entity type.
   * e.g., 'project_proposal' => 'PROP-2026-0001'
   *
   * @param {string} entityType - e.g. 'project_proposal'
   * @param {string} [actorId]
   * @returns {Promise<string>} e.g. 'PROP-2026-0001'
   */
  static async generateNextNumber(entityType, actorId = null) {
    const activeYear = new Date().getFullYear();

    // 1. Fetch sequence config row or create default if missing
    let sequenceRecord = await DocumentSequenceModel.findByEntity(entityType);

    if (!sequenceRecord) {
      const defaultConfig = this.DEFAULTS[entityType] || {
        prefix: `${entityType.toUpperCase().slice(0, 4)}-`,
        paddingLength: 4,
        resetYearly: true,
      };

      sequenceRecord = await DocumentSequenceModel.create({
        entityType,
        prefix: defaultConfig.prefix,
        suffix: null,
        nextSequence: 1,
        paddingLength: defaultConfig.paddingLength,
        currentYear: activeYear,
        resetYearly: defaultConfig.resetYearly,
        createdBy: actorId,
      });
    }

    let assignedNum = sequenceRecord.next_sequence;
    let seqYear = sequenceRecord.current_year || activeYear;

    // 2. Handle yearly reset
    if (sequenceRecord.reset_yearly && sequenceRecord.current_year !== activeYear) {
      assignedNum = 1;
      seqYear = activeYear;
      await DocumentSequenceModel.resetForYear(sequenceRecord.id, activeYear);
    } else {
      await DocumentSequenceModel.incrementAndGet(sequenceRecord.id);
    }

    // 3. Format the document number
    const prefix = sequenceRecord.prefix || '';
    const suffix = sequenceRecord.suffix || '';
    const paddedSeq = String(assignedNum).padStart(sequenceRecord.padding_length || 4, '0');

    let formattedNumber = '';
    if (sequenceRecord.reset_yearly) {
      formattedNumber = `${prefix}${seqYear}-${paddedSeq}${suffix}`;
    } else {
      formattedNumber = `${prefix}${paddedSeq}${suffix}`;
    }

    return formattedNumber;
  }
}

module.exports = DocumentSequenceService;
