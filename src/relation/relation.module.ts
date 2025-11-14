import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Relation } from './entity/relation.entity';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Relation])
  ],
  controllers: [RelationController],
  providers: [RelationService]
})
export class RelationModule {}
