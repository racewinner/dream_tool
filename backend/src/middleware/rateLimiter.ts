import rateLimit from 'express-rate-limit';

// Login rate limiter
export const login = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many failed login attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 2FA verification rate limiter
export const twoFactor = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many failed 2FA attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset request rate limiter
export const passwordResetRequest = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many password reset requests from this IP. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter
export const registration = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many registration attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
