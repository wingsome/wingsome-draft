import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWingker } from './entity/profile-wingker.entity';
import { ProfileWingkerImage } from './entity/profile-wingker-image.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ProfileUser, ProfileWingker, ProfileWingkerImage])
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
