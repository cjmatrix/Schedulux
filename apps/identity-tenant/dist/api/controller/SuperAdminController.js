export class SuperAdminController {
    superAdminService;
    constructor(superAdminService) {
        this.superAdminService = superAdminService;
    }
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const result = await this.superAdminService.login(email, password);
            const isProduction = process.env.NODE_ENV === 'production';
            // Dedicated SuperAdmin cookies (does not conflict with tenant cookies)
            res.cookie('superadmin_access_token', result.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000, // 15 minutes
            });
            res.cookie('superadmin_refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json({
                message: 'SuperAdmin login successful',
                superAdmin: result.superAdmin,
            });
        }
        catch (err) {
            if (err.message === 'INVALID_CREDENTIALS') {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }
            console.error('SuperAdmin login error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    refreshToken = async (req, res) => {
        try {
            const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
            if (!token) {
                res.status(401).json({ error: 'SuperAdmin refresh token is required' });
                return;
            }
            const result = await this.superAdminService.refreshToken(token);
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('superadmin_access_token', result.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('superadmin_refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                message: 'SuperAdmin token rotated successfully',
                superAdmin: result.superAdmin,
            });
        }
        catch (err) {
            if (err.message === 'INVALID_OR_EXPIRED_REFRESH_TOKEN' ||
                err.message === 'INVALID_OR_REVOKED_REFRESH_TOKEN' ||
                err.message === 'SUPERADMIN_NOT_FOUND') {
                res.clearCookie('superadmin_access_token');
                res.clearCookie('superadmin_refresh_token');
                res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
                return;
            }
            console.error('SuperAdmin token refresh error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    logout = async (req, res) => {
        try {
            const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
            await this.superAdminService.logout(token);
            res.clearCookie('superadmin_access_token');
            res.clearCookie('superadmin_refresh_token');
            res.status(200).json({ message: 'SuperAdmin logged out successfully' });
        }
        catch (err) {
            console.error('SuperAdmin logout error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    getProfile = async (req, res) => {
        try {
            if (!req.superAdmin?.super_admin_id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const profile = await this.superAdminService.getProfile(req.superAdmin.super_admin_id);
            res.status(200).json({ superAdmin: profile });
        }
        catch (err) {
            console.error('Get SuperAdmin profile error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    createSuperAdmin = async (req, res) => {
        try {
            const { email, password, name } = req.body;
            if (!email || !password || !name) {
                res.status(400).json({ error: 'Missing required fields: email, password, name' });
                return;
            }
            const created = await this.superAdminService.createSuperAdmin({
                email,
                password,
                name,
            });
            res.status(201).json({
                message: 'SuperAdmin created successfully',
                superAdmin: created,
            });
        }
        catch (err) {
            if (err.message === 'SUPERADMIN_ALREADY_EXISTS') {
                res.status(409).json({ error: 'SuperAdmin with this email already exists' });
                return;
            }
            console.error('Create SuperAdmin error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
