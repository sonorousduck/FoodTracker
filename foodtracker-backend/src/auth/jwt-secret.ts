export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.trim().length > 0) {
    return jwtSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  return 'this-is-my-jwt-secret-that-is-super-super-super-secure';
}
