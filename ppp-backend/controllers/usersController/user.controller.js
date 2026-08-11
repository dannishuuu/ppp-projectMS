const UserService = require('../../services/usersService/user.service');

exports.getProfile = async (req, res, next) => {
    try {
        // Use query param if provided, otherwise fallback to authenticated user's ID
        const userId = req.query.userId || req.user?.id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        const user = await UserService.getUserProfile(userId);
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.register = async (req, res, next) => {
    try {
        const newUser = await UserService.registerUser(req.body);
        return res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        next(error);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await UserService.getUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            status,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await UserService.getUserById(id);
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedUser = await UserService.updateUser(id, req.body);
        return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
};

exports.toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await UserService.toggleUserStatus(id);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await UserService.deleteUser(id);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};