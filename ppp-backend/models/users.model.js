// models/user.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_USER_FIELDS = `
  id, email, username, first_name, last_name, display_name, phone, avatar_url, bio,
  country, city, address, mfa_enabled, email_verified, timezone, locale,
  notification_prefs, dashboard_layout, is_active, created_at, updated_at
`;

class UserModel {
  static async findById(id) {
    const query = `
      SELECT 
        u.id, u.email, u.username, u.first_name, u.last_name, u.display_name, u.phone, u.avatar_url, u.bio,
        u.country, u.city, u.address, u.mfa_enabled, u.email_verified, u.timezone, u.locale,
        u.notification_prefs, u.dashboard_layout, u.is_active, u.created_at, u.updated_at,
        ul.id AS user_location_id,
        ul.country_id,
        ul.region_id,
        ul.zone_id,
        ul.woreda_id,
        c.name AS location_country_name,
        r.name AS location_region_name,
        z.name AS location_zone_name,
        w.name AS location_woreda_name
      FROM users u
      LEFT JOIN user_location ul ON ul.user_id = u.id AND ul.is_deleted = FALSE
      LEFT JOIN countries c ON c.id = ul.country_id
      LEFT JOIN regions r ON r.id = ul.region_id
      LEFT JOIN zones z ON z.id = ul.zone_id
      LEFT JOIN woredas w ON w.id = ul.woreda_id
      WHERE u.id = ? AND u.is_deleted = FALSE;
    `;
    const rows = await db.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByEmailForAuth(email) {
    const query = `
      SELECT id, email, password_hash, mfa_enabled, mfa_secret, 
             failed_login_attempts, locked_until, is_active, is_deleted
      FROM users 
      WHERE email_normalized = LOWER(?);
    `;
    const rows = await db.query(query, {
      replacements: [email],
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async createUser(userData) {
    // Normalise input – support both camelCase and snake_case
    const values = [
      userData.email || userData.user_email,
      userData.passwordHash || userData.password_hash,
      userData.username || null,                 // ✅ username – optional
      userData.firstName || userData.first_name || '',
      userData.lastName || userData.last_name || '',
      userData.phone || userData.phone_number || null,
    ];

    const query = `
      INSERT INTO users (email, password_hash, username, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING ${PUBLIC_USER_FIELDS};
    `;
    const rows = await db.query(query, {
      replacements: values,
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async softDelete(userId, deletedByUserId) {
    const query = `
      UPDATE users 
      SET is_deleted = TRUE, 
          deleted_at = NOW(), 
          deleted_by = ?
      WHERE id = ?;
    `;
    await db.query(query, {
      replacements: [deletedByUserId, userId],
    });
  }

  static async findByUsername(username) {
    const query = `
      SELECT ${PUBLIC_USER_FIELDS} 
      FROM users 
      WHERE username = ? AND is_deleted = FALSE;
    `;
    const rows = await db.query(query, {
      replacements: [username],
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByEmailOrUsernameForAuth(identifier) {
    const query = `
      SELECT id, email, password_hash, mfa_enabled, mfa_secret, 
            failed_login_attempts, locked_until, is_active, is_deleted
      FROM users 
      WHERE (email_normalized = LOWER(?) OR LOWER(username) = LOWER(?))
        AND is_deleted = FALSE;
    `;
    const rows = await db.query(query, {
      replacements: [identifier, identifier],
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByUsernameForAuth(username) {
    const query = `
      SELECT id, email, password_hash, mfa_enabled, mfa_secret, 
            failed_login_attempts, locked_until, is_active, is_deleted
      FROM users 
      WHERE LOWER(username) = LOWER(?) AND is_deleted = FALSE;
    `;
    const rows = await db.query(query, {
      replacements: [username],
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async incrementFailedAttempts(userId) {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
            ELSE locked_until
          END
      WHERE id = :userId
      RETURNING failed_login_attempts, locked_until;
    `;
    const rows = await db.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async resetFailedAttempts(userId) {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE id = :userId;
    `;
    await db.query(query, { replacements: { userId } });
  }

  static async updateLastLogin(userId, ipAddress, userAgent) {
    const query = `
      UPDATE users
      SET last_login_at = NOW(),
          last_login_ip = :ip,
          last_login_user_agent = :ua
      WHERE id = :userId;
    `;
    await db.query(query, {
      replacements: { userId, ip: ipAddress, ua: userAgent },
    });
  }
}

module.exports = UserModel;