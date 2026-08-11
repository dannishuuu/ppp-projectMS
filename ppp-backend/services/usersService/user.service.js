const UserModel = require('../../models/users.model');
const { hashPassword } = require('../../utils/passwordUtils');
const db = require('../../config/database');
const { QueryTypes } = require('sequelize');

class UserService {
  static async registerUser(payload) {
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
    return newUser;
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

    let query = `
      SELECT id, email, username, first_name, last_name, display_name, phone,
             is_active, created_at, updated_at, last_login_at
      FROM users
      WHERE is_deleted = FALSE
    `;
    const replacements = [];

    if (search) {
      query += ` AND (
        email ILIKE ? OR
        username ILIKE ? OR
        first_name ILIKE ? OR
        last_name ILIKE ? OR
        display_name ILIKE ?
      )`;
      const searchTerm = `%${search}%`;
      replacements.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status !== 'all') {
      const isActive = status === 'active';
      query += ` AND is_active = ?`;
      replacements.push(isActive);
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = countResult[0]?.total || 0;

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    replacements.push(limit, offset);

    const users = await db.query(query, {
      replacements,
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

  static async updateUser(userId, payload) {
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

    if (updates.length === 0) {
      return user;
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND is_deleted = FALSE`;
    await db.query(query, { replacements: values, type: QueryTypes.UPDATE });

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