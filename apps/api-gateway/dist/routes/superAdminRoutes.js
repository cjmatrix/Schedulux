"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_js_1 = require("../grpc/client.js");
const router = (0, express_1.Router)();
// To properly authorize GET /me requests over gRPC, we'll need to parse the JWT
// Alternatively, since the identity-tenant's middleware is bypassed (we're directly calling the service),
// we should probably send the access token to the gRPC server and let it verify,
// OR decode it in the gateway and pass the ID.
// For now, to keep it simple, we'll parse the JWT in the gateway or send the token.
// Let's decode the token in the gateway to get the superadmin_id.
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifySuperAdmin = (req, res, next) => {
    const token = req.cookies?.superadmin_access_token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super_admin_secret_key_123');
        if (decoded.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden: Requires SuperAdmin privileges' });
        }
        req.superAdmin = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    client_js_1.superAdminAuthClient.Login({ email, password }, (err, response) => {
        if (err) {
            if (err.code === 16) { // UNAUTHENTICATED
                return res.status(401).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('superadmin_access_token', response.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('superadmin_refresh_token', response.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: response.message,
            superAdmin: response.superAdmin,
        });
    });
});
router.post('/refresh-token', (req, res) => {
    const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
    client_js_1.superAdminAuthClient.RefreshToken({ refresh_token: token }, (err, response) => {
        if (err) {
            res.clearCookie('superadmin_access_token');
            res.clearCookie('superadmin_refresh_token');
            if (err.code === 16) { // UNAUTHENTICATED
                return res.status(401).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('superadmin_access_token', response.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('superadmin_refresh_token', response.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: response.message,
        });
    });
});
router.post('/logout', (req, res) => {
    const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
    client_js_1.superAdminAuthClient.Logout({ refresh_token: token }, (err, response) => {
        res.clearCookie('superadmin_access_token');
        res.clearCookie('superadmin_refresh_token');
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(response);
    });
});
router.get('/me', verifySuperAdmin, (req, res) => {
    const superadmin_id = req.superAdmin.super_admin_id;
    client_js_1.superAdminAuthClient.GetProfile({ superadmin_id }, (err, response) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(response);
    });
});
exports.default = router;
