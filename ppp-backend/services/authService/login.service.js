const UserModel = require('../../models/users.model');
const { comparePassword } = require('../../utils/passwordUtils');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwtUtils');

class LoginService {
  /**
   * Authenticate user with email OR username.
   * @param {string} identifier - Email or username.
   * @param {string} password - Plain password.
   * @param {string} ipAddress - Client IP (for audit).
   * @param {string} userAgent - Client User‑Agent (for audit).
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  static async login(identifier, password, ipAddress, userAgent) {
    // 1. Try to find user by email first, then by username
    let user = await UserModel.findByEmailForAuth(identifier);
    if (!user) {
      user = await UserModel.findByUsernameForAuth(identifier);
    }
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // 3. Account status
    if (!user.is_active || user.is_deleted) {
      throw new Error('Account is disabled. Contact support.');
    }

    // 4. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      await UserModel.incrementFailedAttempts(user.id);
      throw new Error('Invalid credentials');
    }

    // 5. Success – reset attempts and update login audit
    await UserModel.resetFailedAttempts(user.id);
    await UserModel.updateLastLogin(user.id, ipAddress, userAgent);

    // 6. Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 7. Fetch public profile (safe to return to client)
    const userData = await UserModel.findById(user.id);

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify refresh token and issue new access & refresh tokens.
   * @param {string} refreshTokenInput
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  static async refreshToken(refreshTokenInput) {
    if (!refreshTokenInput) {
      const err = new Error('Refresh token is required');
      err.status = 400;
      throw err;
    }

    let decoded;
    try {
      const { verifyToken } = require('../../utils/jwtUtils');
      decoded = verifyToken(refreshTokenInput);
    } catch (e) {
      const err = new Error('Invalid or expired refresh token');
      err.status = 401;
      throw err;
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.is_active || user.is_deleted) {
      const err = new Error('User account is inactive or disabled');
      err.status = 401;
      throw err;
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

module.exports = LoginService;