export const AUTH_CONFIG = {
  session: {
    durationMs: 24 * 60 * 60 * 1000,
    durationLabel: "24h",
    cookieName: "admin_session",
  },

  otp: {
    expiryMs: 5 * 60 * 1000,
    length: 6,
  },

  rateLimit: {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    },
    visitor: {
      maxAttempts: 1,
      windowMs: 60 * 1000,
    },
    notify: {
      maxAttempts: 3,
      windowMs: 10 * 60 * 1000,
    },
  },

  bcryptSaltRounds: 10,
  jwtAlgorithm: "HS256" as const,
} as const;
