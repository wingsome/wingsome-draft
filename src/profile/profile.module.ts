import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Relation } from 'src/relation/entity/relation.entity';
import { User } from 'src/user/entity/user.entity';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWinkerImage } from './entity/profile-winker-image.entity';
import { ProfileWinkerRegister } from './entity/profile-winker-register.entity';
import { ProfileWinker } from './entity/profile-winker.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ProfileUser,
      ProfileWinker,
      ProfileWinkerImage,
      ProfileWinkerRegister,
      Relation
    ])
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService]
})
export class ProfileModule {}
