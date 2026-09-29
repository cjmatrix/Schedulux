export class TenantController {
    tenantService;
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
    register = async (req, res) => {
        try {
            const { business_name, full_name, email, password } = req.body;
            if (!business_name || !full_name || !email || !password) {
                res
                    .status(400)
                    .json({
                    error: "Missing required fields: business_name, full_name, email, password",
                });
                return;
            }
            const result = await this.tenantService.register({
                business_name,
                full_name,
                email,
                password,
            });
            res.status(201).json(result);
        }
        catch (err) {
            if (err.message === "EMAIL_ALREADY_EXISTS") {
                res
                    .status(409)
                    .json({ error: "An account with this email already exists" });
                return;
            }
            console.error("Registration error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
    verifyEmail = async (req, res) => {
        try {
            const { token } = req.query;
            if (!token || typeof token !== "string") {
                res.status(400).json({ error: "Verification token is required" });
                return;
            }
            const result = await this.tenantService.verifyEmail(token);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.message === "INVALID_OR_EXPIRED_TOKEN") {
                res
                    .status(400)
                    .json({ error: "Invalid or expired verification token" });
                return;
            }
            console.error("Verification error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }
            const result = await this.tenantService.login(email, password);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("access_token", result.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 15 * 60 * 1000, // 15 mins
            });
            res.cookie("refresh_token", result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json({
                message: "Login successful",
                tenant: result.tenant,
            });
        }
        catch (err) {
            if (err.message === "INVALID_CREDENTIALS") {
                res.status(401).json({ error: "Invalid email or password" });
                return;
            }
            if (err.message === "EMAIL_NOT_VERIFIED") {
                res
                    .status(403)
                    .json({ error: "Please verify your email before logging in" });
                return;
            }
            if (err.message === "ACCOUNT_INACTIVE") {
                res
                    .status(403)
                    .json({ error: "Your account is not active. Please contact support." });
                return;
            }
            console.error("Login error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
    refreshToken = async (req, res) => {
        try {
            const token = req.cookies?.refresh_token || req.body?.refresh_token;
            if (!token) {
                res.status(401).json({ error: "Refresh token is required" });
                return;
            }
            const result = await this.tenantService.refreshToken(token);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("access_token", result.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 15 * 60 * 1000,
            });
            res.cookie("refresh_token", result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                message: "Token rotated successfully",
                tenant: result.tenant,
            });
        }
        catch (err) {
            if (err.message === "INVALID_OR_EXPIRED_REFRESH_TOKEN" ||
                err.message === "INVALID_OR_REVOKED_REFRESH_TOKEN") {
                res.clearCookie("access_token");
                res.clearCookie("refresh_token");
                res.status(401).json({ error: "Session expired or invalid. Please log in again." });
                return;
            }
            console.error("Token refresh error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
    logout = async (req, res) => {
        try {
            const token = req.cookies?.refresh_token || req.body?.refresh_token;
            await this.tenantService.logout(token);
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            res.status(200).json({ message: "Logged out successfully" });
        }
        catch (err) {
            console.error("Logout error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
}
