import jwt from 'jsonwebtoken';
const SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET ||
    (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_superadmin` : 'superadmin_access_secret_2025');
export const superAdminAuthMiddleware = (req, res, next) => {
    const token = req.cookies?.superadmin_access_token ||
        req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
        res.status(401).json({ error: 'Access denied: SuperAdmin token required' });
        return;
    }
    try {
        const decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET);
        if (decoded.role !== 'super_admin') {
            res.status(403).json({ error: 'Access forbidden: Insufficient privileges' });
            return;
        }
        req.superAdmin = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired SuperAdmin token' });
    }
};
