import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/createuser.dto';
import { UsersService } from 'src/users/users.service';

import { AuthResult } from './dto/authResult.dto';
import { LoginDto } from './dto/login.dto';


type SignInData = { userId: number; email: string };

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService
  ) {}

  async authenticate(input: LoginDto): Promise<AuthResult> {
    console.log(input);
    const user = await this.validateUser(input);

    if (!user) {
      throw new ForbiddenException();
    }

    return this.signIn(user);
  }

  async validateUser(input: LoginDto): Promise<SignInData | null> {
    const user = await this.userService.findOneByEmail(input.email);

    if (!user) {
      return null;
    }

    if (user && user.password === input.password) {
      return {
        userId: user.id,
        email: user.email,
      };
    }
    return null;
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      sub: user.userId,
      username: user.email,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return { accessToken, username: user.email, userId: user.userId };
  }

  async createUser(newUser: CreateUserDto) {
    const user = await this.userService.create(newUser);

    return this.signIn({ userId: user.id, email: user.email });
  }
}
