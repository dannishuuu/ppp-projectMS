const UserModel = require('../../models/users.model');
const { hashPassword } = require('../../utils/passwordUtils');
const db = require('../../config/database');
const { QueryTypes } = require('sequelize');

class UserService {
  static async registerUser(payload, actorId = null) {
    // 1. Check if email already exists
    const existingEmail = await UserModel.findByEmailForAuth(payload.email);
    if (existingEmail) {
      throw new Error('User with this email already exists.');
    }

    // 2. Optional: check username uniqueness if provided
    if (payload.username) {
      const existingUsername = await UserModel.findByUsername(payload.username);
      if (existingUsername) {
        throw new Error('Username is already taken.');
      }
    }

    const passwordHash = await hashPassword(payload.password);

    const newUser = await UserModel.createUser({
      ...payload,
      passwordHash,
    });

    // Save user location if countryId and regionId are provided
    const countryId = payload.countryId || payload.country_id;
    const regionId = payload.regionId || payload.region_id;
    const zoneId = payload.zoneId || payload.zone_id || null;
    const woredaId = payload.woredaId || payload.woreda_id || null;

    if (newUser && countryId && regionId) {
      const locationQuery = `
        INSERT INTO user_location (user_id, country_id, region_id, zone_id, woreda_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(locationQuery, {
        replacements: [newUser.id, countryId, regionId, zoneId, woredaId, actorId, actorId],
        type: QueryTypes.INSERT,
      });
    }

    return this.getUserById(newUser.id);
  }

  static async getUserProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }

  static async getUserById(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }

  static async getAllUsers() {
    const users = await UserModel.findAll();
    return users;
  }

  static async getUsers(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    let baseWhere = ` WHERE u.is_deleted = FALSE`;
    const replacements = [];

    if (search) {
      baseWhere += ` AND (
        u.email ILIKE ? OR
        u.username ILIKE ? OR
        u.first_name ILIKE ? OR
        u.last_name ILIKE ? OR
        u.display_name ILIKE ? OR
        c.name ILIKE ? OR
        r.name ILIKE ?
      )`;
      const searchTerm = `%${search}%`;
      replacements.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status !== 'all') {
      const isActive = status === 'active';
      baseWhere += ` AND u.is_active = ?`;
      replacements.push(isActive);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_location ul ON ul.user_id = u.id AND ul.is_deleted = FALSE
      LEFT JOIN countries c ON c.id = ul.country_id
      LEFT JOIN regions r ON r.id = ul.region_id
      ${baseWhere}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Main query with joined location info
    let query = `
      SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.display_name, u.phone,
             u.is_active, u.created_at, u.updated_at, u.last_login_at,
             ul.country_id, ul.region_id, ul.zone_id, ul.woreda_id,
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
      ${baseWhere}
      ORDER BY u.created_at DESC LIMIT ? OFFSET ?
    `;
    const queryReplacements = [...replacements, limit, offset];

    const users = await db.query(query, {
      replacements: queryReplacements,
      type: QueryTypes.SELECT,
    });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateUser(userId, payload, actorId = null) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Check email uniqueness if changing email
    if (payload.email && payload.email !== user.email) {
      const existingEmail = await UserModel.findByEmailForAuth(payload.email);
      if (existingEmail) {
        throw new Error('User with this email already exists.');
      }
    }

    // Check username uniqueness if changing username
    if (payload.username && payload.username !== user.username) {
      const existingUsername = await UserModel.findByUsername(payload.username);
      if (existingUsername) {
        throw new Error('Username is already taken.');
      }
    }

    // Build update query (display_name, email_normalized, phone_normalized are DB-generated)
    const allowedFields = ['email', 'username', 'first_name', 'last_name', 'phone'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(payload[field]);
      }
    }

    // Handle password update if provided
    if (payload.password) {
      const passwordHash = await hashPassword(payload.password);
      updates.push(`password_hash = ?`);
      values.push(passwordHash);
    }

    if (updates.length > 0) {
      values.push(userId);
      const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND is_deleted = FALSE`;
      await db.query(query, { replacements: values, type: QueryTypes.UPDATE });
    }

    // Handle location update / upsert
    const hasLocationData =
      payload.countryId !== undefined ||
      payload.country_id !== undefined ||
      payload.regionId !== undefined ||
      payload.region_id !== undefined ||
      payload.zoneId !== undefined ||
      payload.zone_id !== undefined ||
      payload.woredaId !== undefined ||
      payload.woreda_id !== undefined;

    if (hasLocationData) {
      const countryId = payload.countryId !== undefined ? payload.countryId : payload.country_id;
      const regionId = payload.regionId !== undefined ? payload.regionId : payload.region_id;
      const zoneId = (payload.zoneId !== undefined ? payload.zoneId : payload.zone_id) || null;
      const woredaId = (payload.woredaId !== undefined ? payload.woredaId : payload.woreda_id) || null;

      if (countryId && regionId) {
        const upsertQuery = `
          INSERT INTO user_location (user_id, country_id, region_id, zone_id, woreda_id, created_by, updated_by, is_deleted)
          VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
          ON CONFLICT (user_id)
          DO UPDATE SET
            country_id = EXCLUDED.country_id,
            region_id = EXCLUDED.region_id,
            zone_id = EXCLUDED.zone_id,
            woreda_id = EXCLUDED.woreda_id,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW(),
            is_deleted = FALSE;
        `;
        await db.query(upsertQuery, {
          replacements: [userId, countryId, regionId, zoneId, woredaId, actorId, actorId],
          type: QueryTypes.INSERT,
        });
      }
    }

    return this.getUserById(userId);
  }

  static async toggleUserStatus(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const query = `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?`;
    await db.query(query, { replacements: [!user.is_active, userId], type: QueryTypes.UPDATE });

    return {
      message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully.`,
      is_active: !user.is_active,
    };
  }

  static async deleteUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    await UserModel.softDelete(userId, userId); // Self-delete for now
    return { message: 'User deleted successfully.' };
  }
}

module.exports = UserService;