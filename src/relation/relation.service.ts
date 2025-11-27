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
import { BlockType } from './enum/block-type.enum';
import { Block } from './entity/block.entity';

@Injectable()
export class RelationService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Relation) private readonly relationRepository: Repository<Relation>,
    @InjectRepository(Block) private readonly blockRepository: Repository<Block>,
    private readonly profileService: ProfileService
  ) {}

  async updateRelation(requestUserId: number, targetUserId: number, relationType: RelationType): Promise<void> {
    if (requestUserId === targetUserId) throw new BadRequestException('target user should not be self');

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('target user not found');

    const block = await this.blockRepository.findOne({
      where: [
        { userId: requestUserId, targetId: targetUserId },
        { userId: targetUserId, targetId: requestUserId }
      ]
    });
    if (block && block.blockType === BlockType.RELATION) throw new ForbiddenException('do not have permission');

    const userMinId = Math.min(requestUserId, targetUserId);
    const userMaxId = Math.max(requestUserId, targetUserId);

    let relation = await this.relationRepository.findOne({ where: { userMinId, userMaxId } });
    if (!relation) relation = this.relationRepository.create({ userId: requestUserId, userMinId, userMaxId, relationType });
    else if (relation.relationType !== relationType) relation.relationType = relationType;
    else return;
    await this.relationRepository.save(relation);
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

  @Transactional()
  async updateBlock(requestUserId: number, targetUserId: number, blockType: BlockType): Promise<void> {
    if (requestUserId === targetUserId) throw new BadRequestException('target user should not be self');

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('target user not found');

    let block = await this.blockRepository.findOne({ where: { userId: requestUserId, targetId: targetUserId } });
    if (!block) block = this.blockRepository.create({ userId: requestUserId, targetId: targetUserId, blockType });
    else if (block.blockType !== blockType) block.blockType = blockType;
    else return;
    await this.blockRepository.save(block);

    if (blockType === BlockType.RELATION) {
      const userMinId = Math.min(requestUserId, targetUserId);
      const userMaxId = Math.max(requestUserId, targetUserId);
      
      const relation = await this.relationRepository.findOne({ where: { userMinId, userMaxId } });
      
      if (relation) {
        await this.profileService.deleteProfileWinkerRegistersByDeleteRelation(requestUserId, relation.id);
        await this.relationRepository.remove(relation);
      }
    }
  }
  
  async getBlocks(userId: number): Promise<Block[]> {
    return await this.blockRepository.find({ where: { userId } });
  }
  
  async deleteBlock(userId: number, blockId: number): Promise<void> {
    const block = await this.blockRepository.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('block not found');
    if (block.userId !== userId) throw new ForbiddenException('do not have permission');
    await this.blockRepository.remove(block);
  }
}
