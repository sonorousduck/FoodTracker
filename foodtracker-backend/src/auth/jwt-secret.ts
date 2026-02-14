import { randomBytes } from 'crypto';

const MIN_SECRET_LENGTH = 32;
let developmentSecret: string | null = null;

export function getJwtSecret(configSecret?: string): string {
  const jwtSecret = configSecret ?? process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (jwtSecret && jwtSecret.trim().length > 0) {
    const trimmedSecret = jwtSecret.trim();

    // Validate secret length in production
    if (isProduction && trimmedSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production. ` +
        'Generate with: openssl rand -hex 32'
      );
    }

    return trimmedSecret;
  }

  // Production requires JWT_SECRET
  if (isProduction) {
    throw new Error(
      'JWT_SECRET environment variable must be set in production. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  // Development: generate a random secret and warn
  if (!developmentSecret) {
    developmentSecret = randomBytes(32).toString('hex');
    console.warn(
      '⚠️  JWT_SECRET not set. Generated random secret for development. ' +
      'This will change on server restart. For production, set JWT_SECRET. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  return developmentSecret;
}
