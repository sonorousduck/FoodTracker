import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Hash a plaintext password using bcrypt
   * @param password - The plaintext password to hash
   * @returns The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plaintext password with a hashed password
   * @param plaintext - The plaintext password to check
   * @param hashed - The hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async comparePassword(plaintext: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hashed);
  }

  /**
   * Check if a password is already hashed (starts with bcrypt prefix)
   * @param password - The password to check
   * @returns True if password appears to be hashed
   */
  isHashed(password: string): boolean {
    return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
  }
}
