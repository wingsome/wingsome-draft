import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWingker } from './entity/profile-wingker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileUser, ProfileWingker])
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
