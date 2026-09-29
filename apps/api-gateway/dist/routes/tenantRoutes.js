"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_js_1 = require("../grpc/client.js");
const router = (0, express_1.Router)();
router.post('/register', (req, res) => {
    const { business_name, full_name, email, password } = req.body;
    client_js_1.tenantAuthClient.Register({ business_name, full_name, email, password }, (err, response) => {
        if (err) {
            if (err.code === 6) {
                return res.status(409).json({ error: err.details });
            }
            if (err.code === 3) {
                return res.status(400).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json(response);
    });
});
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    client_js_1.tenantAuthClient.Login({ email, password }, (err, response) => {
        if (err) {
            if (err.code === 16) { // UNAUTHENTICATED
                return res.status(401).json({ error: err.details });
            }
            if (err.code === 7) { // PERMISSION_DENIED
                return res.status(403).json({ error: err.details });
            }
            if (err.code === 3) { // INVALID_ARGUMENT
                return res.status(400).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('access_token', response.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', response.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: response.message,
            tenant: response.tenant,
        });
    });
});
router.get('/verify-email', (req, res) => {
    const { token } = req.query;
    client_js_1.tenantAuthClient.VerifyEmail({ token }, (err, response) => {
        if (err) {
            if (err.code === 3) { // INVALID_ARGUMENT
                return res.status(400).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(response);
    });
});
router.post('/refresh-token', (req, res) => {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    client_js_1.tenantAuthClient.RefreshToken({ refresh_token: token }, (err, response) => {
        if (err) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            if (err.code === 16) { // UNAUTHENTICATED
                return res.status(401).json({ error: err.details });
            }
            if (err.code === 3) { // INVALID_ARGUMENT
                return res.status(400).json({ error: err.details });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('access_token', response.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', response.refresh_token, {
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
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    client_js_1.tenantAuthClient.Logout({ refresh_token: token }, (err, response) => {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(response);
    });
});
exports.default = router;
