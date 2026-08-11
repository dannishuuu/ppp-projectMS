// controllers/projectController/documentSequence.controller.js
const DocumentSequenceService = require('../../services/projectService/documentSequence.service');
const DocumentSequenceModel   = require('../../models/documentSequence.model');

class DocumentSequenceController {
  /**
   * GET /document-sequences
   * List all sequences with optional pagination/search
   */
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
      } = req.query;

      const { QueryTypes } = require('sequelize');
      const db = require('../../config/database');

      let where = `WHERE is_deleted = FALSE`;
      const replacements = {};

      if (search) {
        where += ` AND (entity_type ILIKE :search OR prefix ILIKE :search)`;
        replacements.search = `%${search}%`;
      }

      const [{ total }] = await db.query(
        `SELECT COUNT(*) AS total FROM document_sequences ${where}`,
        { replacements, type: QueryTypes.SELECT }
      );

      const offset = (parseInt(page) - 1) * parseInt(limit);
      replacements.limit  = parseInt(limit);
      replacements.offset = offset;

      const rows = await db.query(
        `SELECT * FROM document_sequences ${where}
         ORDER BY created_at ASC
         LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT }
      );

      res.json({
        success: true,
        data: {
          sequences: rows,
          pagination: {
            total: parseInt(total, 10),
            page:  parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(parseInt(total, 10) / parseInt(limit)),
          },
        },
      });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /document-sequences/:id
   */
  static async getById(req, res) {
    try {
      const { QueryTypes } = require('sequelize');
      const db = require('../../config/database');
      const rows = await db.query(
        `SELECT * FROM document_sequences WHERE id = :id AND is_deleted = FALSE`,
        { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
      );
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Sequence not found.' });
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /document-sequences
   */
  static async create(req, res) {
    try {
      const {
        entityType, prefix, suffix,
        paddingLength, currentYear, resetYearly,
        nextSequence,
      } = req.body;

      if (!entityType) return res.status(400).json({ success: false, error: 'entityType is required.' });
      if (!prefix)     return res.status(400).json({ success: false, error: 'prefix is required.' });

      const created = await DocumentSequenceModel.create({
        entityType,
        prefix,
        suffix:        suffix        ?? null,
        nextSequence:  nextSequence  ?? 1,
        paddingLength: paddingLength ?? 4,
        currentYear:   currentYear   ?? new Date().getFullYear(),
        resetYearly:   resetYearly   ?? false,
        createdBy:     req.user?.id  ?? null,
      });

      res.status(201).json({ success: true, data: created, message: 'Sequence created successfully.' });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /document-sequences/:id
   */
  static async update(req, res) {
    try {
      const { QueryTypes } = require('sequelize');
      const db = require('../../config/database');

      const allowed = ['entity_type','prefix','suffix','next_sequence','padding_length','current_year','reset_yearly','is_active'];
      const fieldMap = {
        entityType:    'entity_type',
        prefix:        'prefix',
        suffix:        'suffix',
        nextSequence:  'next_sequence',
        paddingLength: 'padding_length',
        currentYear:   'current_year',
        resetYearly:   'reset_yearly',
        isActive:      'is_active',
      };

      const setClauses = [];
      const replacements = { id: req.params.id, updatedBy: req.user?.id ?? null };

      for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
        if (req.body[jsKey] !== undefined) {
          setClauses.push(`${dbCol} = :${jsKey}`);
          replacements[jsKey] = req.body[jsKey] ?? null;
        }
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update.' });
      }

      setClauses.push('updated_at = NOW()');

      const rows = await db.query(
        `UPDATE document_sequences SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = FALSE RETURNING *`,
        { replacements, type: QueryTypes.SELECT }
      );

      if (!rows[0]) return res.status(404).json({ success: false, error: 'Sequence not found.' });
      res.json({ success: true, data: rows[0], message: 'Sequence updated successfully.' });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /document-sequences/:id  (soft delete)
   */
  static async remove(req, res) {
    try {
      const { QueryTypes } = require('sequelize');
      const db = require('../../config/database');
      const rows = await db.query(
        `UPDATE document_sequences SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :deletedBy
         WHERE id = :id AND is_deleted = FALSE RETURNING id`,
        { replacements: { id: req.params.id, deletedBy: req.user?.id ?? null }, type: QueryTypes.SELECT }
      );
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Sequence not found.' });
      res.json({ success: true, message: 'Sequence deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /document-sequences/:id/reset
   * Reset sequence counter to 1 (optionally updating the year)
   */
  static async reset(req, res) {
    try {
      const year = req.body.year ?? new Date().getFullYear();
      const updated = await DocumentSequenceModel.resetForYear(req.params.id, year);
      if (!updated) return res.status(404).json({ success: false, error: 'Sequence not found.' });
      // After reset, next_sequence is 2 (because resetForYear consumes 1 slot)
      // Let's just reset to 1 cleanly via direct update
      const { QueryTypes } = require('sequelize');
      const db = require('../../config/database');
      const [row] = await db.query(
        `UPDATE document_sequences SET next_sequence = 1, current_year = :year, updated_at = NOW()
         WHERE id = :id AND is_deleted = FALSE RETURNING *`,
        { replacements: { id: req.params.id, year }, type: QueryTypes.SELECT }
      );
      res.json({ success: true, data: row, message: `Sequence reset to 1 for year ${year}.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = DocumentSequenceController;
