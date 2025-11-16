import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Relation } from './entity/relation.entity';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Relation]),
    ProfileModule
  ],
  controllers: [RelationController],
  providers: [RelationService]
})
export class RelationModule {}
