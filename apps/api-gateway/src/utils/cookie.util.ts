import { CookieOptions } from "express";

export function getAccessTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge =
    parseInt(process.env.ACCESS_TOKEN_MAX_AGE_MS || "", 10) ||
    15 * 60 * 1000; 

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
  };
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge =
    parseInt(process.env.REFRESH_TOKEN_MAX_AGE_MS || "", 10) ||
    7 * 24 * 60 * 60 * 1000; // 7 days default

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
  };
}
