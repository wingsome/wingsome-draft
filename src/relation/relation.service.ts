import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Relation } from './entity/relation.entity';
import { Repository } from 'typeorm';
import { RelationType } from './enum/relation-type.enum';
import { User } from 'src/user/entity/user.entity';
import { RelationResponseDto } from './dto/relation-response.dto';
import { RequestStatus } from 'src/common/enum/request-status.enum';
import { ProfileService } from 'src/profile/profile.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class RelationService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Relation) private readonly relationRepository: Repository<Relation>,
    private readonly profileService: ProfileService
  ) {}

  async createRelation(requestUserId: number, targetUserId: number, relationType: RelationType): Promise<void> {
    if (requestUserId === targetUserId) throw new BadRequestException('target user should not be self');

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('target user not found');

    const userMinId = Math.min(requestUserId, targetUserId);
    const userMaxId = Math.max(requestUserId, targetUserId);

    const relationship = this.relationRepository.create({ userId: requestUserId, userMinId, userMaxId, relationType });
    try {
      await this.relationRepository.save(relationship);
    } catch (e) {
      if (e.code === '23505') throw new ConflictException('this relationship already exists');
      throw e;
    }
  }
  
  async getRelations(userId: number): Promise<RelationResponseDto> {
    const relations = await this.relationRepository
      .createQueryBuilder('r')
      .where('r.userMinId = :userId OR r.userMaxId = :userId', { userId })
      .getMany();
  
    const response: RelationResponseDto = { request: [], requested: [] };
  
    for (const r of relations) {
      const otherUserId = r.userMinId === userId ? r.userMaxId : r.userMinId;
  
      const item = {
        id: r.id,
        userId: otherUserId,
        relationType: r.relationType,
        status: r.status
      };
  
      if (r.userId === userId) response.request.push(item);
      else response.requested.push(item);
    }
  
    return response;
  }

  async updateRelationType(userId: number, relationId: number, relationType: RelationType): Promise<void> {
    const relation = await this.relationRepository.findOne({ where: { id: relationId } });
    if (!relation) throw new NotFoundException('relation not found');
    if (relation.userMinId !== userId && relation.userMaxId !== userId) {
      throw new ForbiddenException('do not have permission');
    }
    relation.relationType = relationType;
    await this.relationRepository.save(relation);
  }

  @Transactional()
  async updateeRelationStatus(userId: number, relationId: number): Promise<void> {
    const relation = await this.relationRepository.findOne({ where: { id: relationId } });
    if (!relation) throw new NotFoundException('relation not found');
    if (relation.userId === userId || (relation.userMinId !== userId && relation.userMaxId !== userId)) {
      throw new ForbiddenException('do not have permission');
    }
    relation.status = RequestStatus.ACCEPTED;
    await this.relationRepository.save(relation);
  }
  
  @Transactional()
  async deleteRelation(userId: number, relationId: number): Promise<void> {
    const relation = await this.relationRepository.findOne({ where: { id: relationId } });
    if (!relation) throw new NotFoundException('relation not found');
    if (relation.userMinId !== userId && relation.userMaxId !== userId) {
      throw new ForbiddenException('do not have permission');
    }
    await this.profileService.deleteProfileWinkerRegistersByDeleteRelation(userId, relationId);
    await this.relationRepository.remove(relation);
  }
}
