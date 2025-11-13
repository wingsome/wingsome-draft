import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Relationship } from './entity/relationship.entity';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Relationship])
  ],
  controllers: [RelationController],
  providers: [RelationService]
})
export class RelationModule {}
