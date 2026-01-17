import { PartialType } from '@nestjs/mapped-types';

import { CreateRecipeDto } from './createrecipe.dto';

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}
