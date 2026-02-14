import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './login.dto';
import { CreateUserDto } from '../../users/dto/createuser.dto';

describe('Auth DTO validation', () => {
  describe('CreateUserDto', () => {
    it('accepts a valid signup payload', () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'user@example.com',
        firstName: 'Alex',
        lastName: 'Smith',
        password: 'Password1!',
      });

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid signup payload', () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        password: '123',
      });

      const errors = validateSync(dto);
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );

      expect(messages).toEqual(
        expect.arrayContaining([
          'email must be an email',
          'firstName should not be empty',
          'lastName should not be empty',
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
          'Password must be at least 8 characters long',
        ]),
      );
    });
  });

  describe('LoginDto', () => {
    it('accepts a valid login payload', () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'password',
      });

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid login payload', () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: '',
      });

      const errors = validateSync(dto);
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );

      expect(messages).toEqual(
        expect.arrayContaining([
          'email must be an email',
          'password should not be empty',
        ]),
      );
    });
  });
});
