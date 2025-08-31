import { PartialType } from '@nestjs/mapped-types';

import { CreateUserDto } from './createuser.dto';


export class UpdateUserDto extends PartialType(CreateUserDto) {}
