// middleware/auth.js
const jwt = require('jsonwebtoken');
const UserModel = require('../models/users.model');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from DB to verify real-time active status
        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User account not found. Session expired.' });
        }

        // If user is deactivated, return 401 to force logout & token invalidation
        if (!user.is_active) {
            return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
        }

        req.user = user; // attach user object (contains id, email, is_active, etc.)
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;