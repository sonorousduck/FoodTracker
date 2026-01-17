import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateUserDto } from "./dto/createuser.dto";
import { User } from "./entities/user.entity";


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOneBy({ email: createUserDto.email });

    if (user) {
      throw new ConflictException();
    }

    return this.userRepository.save({
      ...createUserDto,
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw Error("No user found");
    }

    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async updateRefreshToken(
    userId: number,
    refreshTokenHash: string,
    refreshTokenExpiresAt: Date
  ) {
    await this.userRepository.update(userId, {
      refreshTokenHash,
      refreshTokenExpiresAt,
    });
  }

  async clearRefreshToken(userId: number) {
    await this.userRepository.update(userId, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  async findByRefreshTokenHash(refreshTokenHash: string) {
    return this.userRepository.findOne({ where: { refreshTokenHash } });
  }
}
