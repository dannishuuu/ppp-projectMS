const LoginService = require('../../services/authService/login.service');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 'email' can now be either email or username
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username and password are required',
      });
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';

    const result = await LoginService.login(email, password, ip, ua);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};