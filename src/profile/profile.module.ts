import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWinker } from './entity/profile-winker.entity';
import { ProfileWinkerImage } from './entity/profile-winker-image.entity';
import { User } from 'src/user/entity/user.entity';
import { ProfileWinkerReputation } from './entity/profile-winker-reputation.entity';
import { ProfileWinkerRegister } from './entity/profile-winker-register.entity';
import { Relation } from 'src/relation/entity/relation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ProfileUser,
      ProfileWinker,
      ProfileWinkerImage,
      ProfileWinkerReputation,
      ProfileWinkerRegister,
      Relation
    ])
  ],
  controllers: [ProfileController],
  providers: [ProfileService]
})
export class ProfileModule {}
