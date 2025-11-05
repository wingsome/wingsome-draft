import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileUserDto } from './create-profile-user.dto';

export class UpdateUserDto extends PartialType(CreateProfileUserDto) {}
